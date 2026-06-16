"""Unit tests for the device degradation engine (state transitions)."""

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Optional

from backend.application.services.degradation_service import (
    STATUS_GREEN,
    STATUS_RED,
    STATUS_YELLOW,
    evaluate_device_health,
)

NOW = datetime(2026, 6, 16, 12, 0, 0, tzinfo=timezone.utc)


@dataclass
class Ev:
    code: str
    severity: str
    occurrences: int
    counter: int
    event_time: datetime


@dataclass
class Maint:
    changed_at: Optional[datetime]
    change_counter: int = 0


def _err(code="42.01", occ=1, counter=1000, days_ago=0, sev="ERROR"):
    return Ev(code, sev, occ, counter, NOW - timedelta(days=days_ago))


# ---------------------------------------------------------------------------
# Empty / no-history
# ---------------------------------------------------------------------------
def test_no_events_is_green():
    health = evaluate_device_health([], now=NOW)
    assert health.status == STATUS_GREEN
    assert health.triggered_rule is None


# ---------------------------------------------------------------------------
# Rule 1 — Recurrence
# ---------------------------------------------------------------------------
def test_recurrence_by_occurrences_triggers_red():
    # 4 occurrences (> 3) of a critical code, recent.
    events = [_err(occ=4, counter=2000, days_ago=1)]
    health = evaluate_device_health(events, now=NOW)
    assert health.status == STATUS_RED
    assert health.triggered_rule == "recurrence"
    assert "Técnico" in health.recommendation


def test_recurrence_across_multiple_snapshots_within_days():
    events = [
        _err(counter=1000, days_ago=5),
        _err(counter=1500, days_ago=4),
        _err(counter=2000, days_ago=3),
        _err(counter=2500, days_ago=2),
    ]
    health = evaluate_device_health(events, now=NOW)
    assert health.status == STATUS_RED
    assert health.triggered_rule == "recurrence"


def test_three_occurrences_not_enough_stays_yellow():
    # Exactly 3 (not > 3) recent critical occurrences -> still monitoring.
    events = [_err(occ=3, counter=2000, days_ago=1)]
    health = evaluate_device_health(events, now=NOW)
    assert health.status == STATUS_YELLOW
    assert health.triggered_rule is None


def test_recurrence_outside_window_does_not_trigger():
    # 4 events but spread far apart in pages AND time -> not recurrence.
    events = [
        _err(counter=0, days_ago=60),
        _err(counter=20_000, days_ago=45),
        _err(counter=40_000, days_ago=30),
        _err(counter=60_000, days_ago=20),
    ]
    health = evaluate_device_health(events, now=NOW)
    assert health.status == STATUS_GREEN  # last critical is old -> stabilized
    assert health.triggered_rule == "stable"


def test_same_event_reimported_across_snapshots_counts_once():
    # Cumulative log re-saved 6 times: the SAME physical event (same event_time,
    # unknown counter) must count ONCE, not six times.
    et = NOW - timedelta(days=8)
    events = [Ev("13.A7.D5", "ERROR", 1, 0, et) for _ in range(6)]
    health = evaluate_device_health(events, now=NOW)
    assert health.status != STATUS_RED
    assert health.triggered_rule != "recurrence"


def test_zero_counter_does_not_bypass_time_window():
    # Distinct OLD events (>7 days) with unknown counter (0). The page window must
    # not rescue them (regression: latest - 0 <= 5000 was always true).
    events = [Ev("13.A7.D5", "ERROR", 1, 0, NOW - timedelta(days=d)) for d in (30, 25, 20, 15, 10, 8)]
    health = evaluate_device_health(events, now=NOW)
    assert health.triggered_rule != "recurrence"


def test_recent_recurrent_code_flagged_not_old_one():
    # An old single error and a recent recurrent one: must flag the RECENT code.
    events = [
        Ev("13.A7.D5", "ERROR", 1, 0, NOW - timedelta(days=8)),  # old, single read
        Ev("60.00.03", "ERROR", 6, 0, NOW - timedelta(days=2)),  # recent, 6 occurrences
    ]
    health = evaluate_device_health(events, now=NOW)
    assert health.status == STATUS_RED
    assert health.triggered_rule == "recurrence"
    assert "60.00.03" in health.reason
    assert "13.A7.D5" not in health.reason


# ---------------------------------------------------------------------------
# Rule 2 — Post-repair failure
# ---------------------------------------------------------------------------
def test_post_repair_failure_triggers_red():
    maint = [Maint(changed_at=NOW - timedelta(days=3), change_counter=1800)]
    events = [
        _err(counter=1500, days_ago=5),  # before repair
        _err(counter=2200, days_ago=1),  # after repair -> persists
    ]
    health = evaluate_device_health(events, maintenance=maint, now=NOW)
    assert health.status == STATUS_RED
    assert health.triggered_rule == "post_repair"


def test_repair_resolved_no_error_after_is_not_post_repair():
    maint = [Maint(changed_at=NOW - timedelta(days=2), change_counter=1800)]
    events = [_err(counter=1500, days_ago=5)]  # only before repair
    health = evaluate_device_health(events, maintenance=maint, now=NOW)
    assert health.triggered_rule != "post_repair"


def test_post_repair_takes_priority_over_recurrence():
    maint = [Maint(changed_at=NOW - timedelta(days=2), change_counter=1000)]
    events = [_err(occ=4, counter=2000, days_ago=1)]  # would also be recurrence
    health = evaluate_device_health(events, maintenance=maint, now=NOW)
    assert health.status == STATUS_RED
    assert health.triggered_rule == "post_repair"


# ---------------------------------------------------------------------------
# Rule 3 — Stabilization
# ---------------------------------------------------------------------------
def test_no_critical_errors_is_green_stable():
    events = [_err(sev="WARNING", counter=500, days_ago=1)]
    health = evaluate_device_health(events, now=NOW)
    assert health.status == STATUS_GREEN
    assert health.triggered_rule == "stable"


def test_stable_after_many_pages_clean():
    events = [
        _err(counter=1000, days_ago=2),  # last critical
        Ev("00.00", "INFO", 1, 12_000, NOW - timedelta(days=1)),  # +11k pages clean
    ]
    health = evaluate_device_health(events, now=NOW)
    assert health.status == STATUS_GREEN
    assert health.triggered_rule == "stable"


def test_stable_after_many_days_clean():
    events = [_err(counter=1000, days_ago=20)]  # >15 days old, low page delta
    health = evaluate_device_health(events, now=NOW)
    assert health.status == STATUS_GREEN
    assert health.triggered_rule == "stable"


# ---------------------------------------------------------------------------
# Default — Monitoring
# ---------------------------------------------------------------------------
def test_recent_single_critical_is_yellow():
    events = [_err(occ=1, counter=2000, days_ago=1)]
    health = evaluate_device_health(events, now=NOW)
    assert health.status == STATUS_YELLOW
    assert health.triggered_rule is None


def test_naive_datetimes_are_handled():
    naive = datetime(2026, 6, 15, 12, 0, 0)  # no tzinfo
    events = [Ev("42.01", "ERROR", 4, 2000, naive)]
    health = evaluate_device_health(events, now=NOW)
    assert health.status == STATUS_RED
