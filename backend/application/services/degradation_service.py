"""Device degradation engine.

Evaluates the temporal health of a printer from its telemetry history and the
record of technical interventions, deciding whether an automatic technician
visit should be dispatched.

Rules (in priority order):
  R2 — Post-repair failure : a critical error reappears *after* a maintenance was
                             registered  -> RED (technician).
  R1 — Recurrence          : a critical error repeats > 3 times within 5,000 pages
                             or 7 days -> RED (technician).
  R3 — Stabilization       : no critical errors for 10,000 pages or 15 days
                             -> GREEN (stable).
  Default                  : YELLOW (monitoring).

The engine is intentionally pure: it receives plain data (telemetry events and
maintenance records) and returns a frozen DeviceHealth, so it is trivial to unit
test the state transitions.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import List, Optional, Protocol

# --- Tunable thresholds -------------------------------------------------------
CRITICAL_SEVERITIES = {"ERROR", "CRITICAL"}

RECURRENCE_THRESHOLD = 3  # "> 3 times"
RECURRENCE_PAGES = 5_000
RECURRENCE_DAYS = 7

STABLE_PAGES = 10_000
STABLE_DAYS = 15

# --- Status constants ---------------------------------------------------------
STATUS_RED = "RED"
STATUS_YELLOW = "YELLOW"
STATUS_GREEN = "GREEN"


class _Event(Protocol):
    code: str
    severity: str
    occurrences: int
    counter: int
    event_time: datetime


class _Maintenance(Protocol):
    changed_at: Optional[datetime]
    change_counter: int


@dataclass(frozen=True)
class DeviceHealth:
    """Outcome of a degradation evaluation."""

    status: str  # RED | YELLOW | GREEN
    label: str
    reason: str
    recommendation: str
    triggered_rule: Optional[str] = None  # "recurrence" | "post_repair" | "stable"


def _aware(dt: datetime) -> datetime:
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt


def _is_critical(ev: _Event) -> bool:
    return (ev.severity or "").upper() in CRITICAL_SEVERITIES


def evaluate_device_health(
    events: List[_Event],
    maintenance: Optional[List[_Maintenance]] = None,
    now: Optional[datetime] = None,
) -> DeviceHealth:
    """Decide the health status of a device from its telemetry history."""
    maintenance = maintenance or []
    now = _aware(now) if now else datetime.now(timezone.utc)

    if not events:
        return DeviceHealth(
            status=STATUS_GREEN,
            label="Sin historial",
            reason="No hay eventos registrados para el equipo.",
            recommendation="Sin acciones requeridas.",
            triggered_rule=None,
        )

    crit = [e for e in events if _is_critical(e)]
    latest_counter = max(e.counter for e in events)

    # ------------------------------------------------------------------
    # Rule 2 — Post-repair failure (highest priority).
    # ------------------------------------------------------------------
    last_maint = _latest_maintenance(maintenance)
    if last_maint is not None and last_maint.changed_at is not None:
        maint_at = _aware(last_maint.changed_at)
        persisted = [e for e in crit if _aware(e.event_time) > maint_at]
        if persisted:
            code = persisted[-1].code
            return DeviceHealth(
                status=STATUS_RED,
                label="Falla post-reparación",
                reason=(
                    f"El error crítico {code} reapareció tras el último "
                    f"mantenimiento registrado."
                ),
                recommendation="Enviar técnico: la reparación no resolvió la falla.",
                triggered_rule="post_repair",
            )

    # ------------------------------------------------------------------
    # Rule 1 — Recurrence of a critical error.
    # ------------------------------------------------------------------
    by_code: dict[str, list[_Event]] = {}
    for e in crit:
        by_code.setdefault(e.code, []).append(e)

    for code, group in by_code.items():
        recent = [
            e
            for e in group
            if (now - _aware(e.event_time)).days <= RECURRENCE_DAYS
            or (latest_counter - e.counter) <= RECURRENCE_PAGES
        ]
        total = sum(max(1, e.occurrences) for e in recent)
        if total > RECURRENCE_THRESHOLD:
            return DeviceHealth(
                status=STATUS_RED,
                label="En degradación",
                reason=(
                    f"El error crítico {code} se repitió {total} veces en "
                    f"{RECURRENCE_PAGES:,} páginas o {RECURRENCE_DAYS} días."
                ),
                recommendation="Se recomienda Técnico.",
                triggered_rule="recurrence",
            )

    # ------------------------------------------------------------------
    # Rule 3 — Stabilization.
    # ------------------------------------------------------------------
    if not crit:
        return DeviceHealth(
            status=STATUS_GREEN,
            label="Estable",
            reason="El equipo opera sin errores críticos registrados.",
            recommendation="Sin acciones requeridas.",
            triggered_rule="stable",
        )

    last_crit = max(crit, key=lambda e: _aware(e.event_time))
    days_clean = (now - _aware(last_crit.event_time)).days
    pages_clean = latest_counter - last_crit.counter
    if days_clean >= STABLE_DAYS or pages_clean >= STABLE_PAGES:
        return DeviceHealth(
            status=STATUS_GREEN,
            label="Estable",
            reason=(
                f"Sin errores críticos por {pages_clean:,} páginas / {days_clean} días "
                f"desde el último incidente."
            ),
            recommendation="Sin acciones requeridas.",
            triggered_rule="stable",
        )

    # ------------------------------------------------------------------
    # Default — Monitoring.
    # ------------------------------------------------------------------
    return DeviceHealth(
        status=STATUS_YELLOW,
        label="En observación",
        reason="Se detectaron errores críticos recientes sin alcanzar el umbral de alerta.",
        recommendation="Monitorear la evolución del equipo.",
        triggered_rule=None,
    )


def _latest_maintenance(maintenance: List[_Maintenance]) -> Optional[_Maintenance]:
    dated = [m for m in maintenance if getattr(m, "changed_at", None) is not None]
    if not dated:
        return None
    return max(dated, key=lambda m: _aware(m.changed_at))
