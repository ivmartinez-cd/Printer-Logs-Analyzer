"""Service to compute consumable warnings from log events and printer consumable catalog."""

from __future__ import annotations

import re
from typing import List

from backend.domain.entities import ConsumableWarning, EnrichedEvent, PrinterConsumable

# Categorías excluidas del panel: el contador de impresión no mide el
# consumo real de estos componentes, por lo que el % de uso no es accionable.
_EXCLUDED_CATEGORIES = {"toner"}

# Substrings en la descripción que identifican rodillos del ADF (Automatic
# Document Feeder). El contador de la impresora registra páginas impresas,
# no ciclos del alimentador, así que el umbral de vida no aplica a estos.
# Patrones basados en terminología estándar de los Service Cost Data de HP.
ADF_DESCRIPTION_PATTERNS: list[str] = [
    "adf",
    "document feeder",
    "automatic document feeder",
]


def _is_adf_consumable(description: str) -> bool:
    """Return True if description matches any ADF roller pattern (case-insensitive)."""
    lower = description.lower()
    return any(p in lower for p in ADF_DESCRIPTION_PATTERNS)


def _wildcard_to_regex(pattern: str) -> re.Pattern[str]:
    """Convert a code pattern with optional trailing 'z' wildcard to a compiled regex.

    'z' in a pattern means "any single hex digit (0-9, A-F, case-insensitive)".
    Example: "53.B0.0z" -> regex matching 53.B0.01, 53.B0.0A, etc.
    """
    escaped = re.escape(pattern)
    # re.escape turns 'z' into 'z' (no special meaning), but the 'z' wildcard
    # can appear anywhere in the pattern per spec — here we apply it globally.
    escaped = escaped.replace("z", "[0-9A-Fa-f]")
    return re.compile(f"^{escaped}$", re.IGNORECASE)


_STATUS_ORDER = {"replace": 0, "warning": 1, "ok": 2}


def compute_consumable_warnings(
    events: List[EnrichedEvent],
    consumables: List[PrinterConsumable],
    max_counter: int,
) -> List[ConsumableWarning]:
    """Return one ConsumableWarning per consumable with life_pages > 0.

    Excludes consumables where the page counter is not a meaningful proxy for
    wear: toner cartridges (category 'toner') and ADF rollers (description
    matches ADF_DESCRIPTION_PATTERNS).

    All other consumables for the model are included. matched_codes is populated
    only when the consumable's related_codes overlap with log event codes.

    Args:
        events: Enriched events from the parsed log.
        consumables: Consumable parts for the selected printer model.
        max_counter: Highest counter value seen in the log.

    Returns:
        List sorted by status (replace → warning → ok), then usage_pct desc.
    """
    if max_counter <= 0 or not consumables:
        return []

    # Build set of unique codes seen in the log for fast lookup
    log_codes = {e.code for e in events if e.code}

    warnings: List[ConsumableWarning] = []

    for consumable in consumables:
        # Skip categories where the page counter doesn't reflect actual wear
        if consumable.category in _EXCLUDED_CATEGORIES:
            continue
        # Skip ADF rollers — their cycle count differs from the print counter
        if _is_adf_consumable(consumable.description):
            continue
        life = consumable.life_pages
        if not life or life <= 0:
            continue

        matched: set[str] = set()
        for code_pattern in consumable.related_codes:
            regex = _wildcard_to_regex(code_pattern)
            for log_code in log_codes:
                if regex.match(log_code):
                    matched.add(log_code)

        usage_pct = round((max_counter / life) * 100, 2)
        if usage_pct >= 100:
            status = "replace"
        elif usage_pct >= 80:
            status = "warning"
        else:
            status = "ok"

        warnings.append(
            ConsumableWarning(
                part_number=consumable.part_number,
                description=consumable.description,
                category=consumable.category,
                life_pages=life,
                current_counter=max_counter,
                usage_pct=usage_pct,
                status=status,
                matched_codes=sorted(matched),
            )
        )

    return sorted(warnings, key=lambda w: (_STATUS_ORDER[w.status], -w.usage_pct))
