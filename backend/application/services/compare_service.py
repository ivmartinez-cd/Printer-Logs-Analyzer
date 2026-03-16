"""Trend calculation for saved analysis vs current log comparison."""

from __future__ import annotations

from typing import Any, List


def _severity_is_error(severity: str | None) -> bool:
    return (severity or "").strip().upper() == "ERROR"


def calculate_trend(
    saved_incidents: List[dict],
    current_incidents: List[Any],
    diff: dict,
) -> str:
    """
    Compute trend: "mejoro" | "estable" | "empeoro".

    Empeoró if at least one of:
      - new code with severity ERROR
      - existing ERROR code increases >= 3 occurrences
      - total ERROR occurrences increase >= 20%

    Mejoró if all of:
      - at least one ERROR disappears
      - total ERROR occurrences decrease
      - no new ERROR codes appear

    Estable otherwise.
    """
    saved_by_code = {i["code"]: i for i in saved_incidents}
    current_by_code = {inc.code: inc for inc in current_incidents}
    codigos_nuevos = diff.get("codigos_nuevos") or []
    codigos_desaparecidos = diff.get("codigos_desaparecidos") or []
    cambios_ocurrencias = diff.get("cambios_ocurrencias") or []

    total_saved_errors = sum(
        i.get("occurrences") or 0
        for i in saved_incidents
        if _severity_is_error(i.get("severity"))
    )
    total_current_errors = sum(
        inc.occurrences
        for inc in current_incidents
        if _severity_is_error(getattr(inc, "severity", None))
    )

    # Empeoró: at least one condition
    for code in codigos_nuevos:
        inc = current_by_code.get(code)
        if inc and _severity_is_error(getattr(inc, "severity", None)):
            return "empeoro"

    for c in cambios_ocurrencias:
        saved_inc = saved_by_code.get(c.get("code"))
        if not saved_inc:
            continue
        if _severity_is_error(saved_inc.get("severity")) and (c.get("delta") or 0) >= 3:
            return "empeoro"

    if total_saved_errors > 0 and total_current_errors >= total_saved_errors * 1.20:
        return "empeoro"

    # Mejoró: all conditions
    errors_disappeared = any(
        _severity_is_error((saved_by_code.get(code) or {}).get("severity"))
        for code in codigos_desaparecidos
    )
    total_errors_decreased = total_current_errors < total_saved_errors
    no_new_errors = not any(
        _severity_is_error(getattr(current_by_code.get(code), "severity", None))
        for code in codigos_nuevos
    )
    if errors_disappeared and total_errors_decreased and no_new_errors:
        return "mejoro"

    return "estable"
