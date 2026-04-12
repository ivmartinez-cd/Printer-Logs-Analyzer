"""Tests for compute_consumable_warnings service."""

from datetime import datetime
from uuid import uuid4

import pytest

from backend.application.services.consumable_warning_service import compute_consumable_warnings
from backend.domain.entities import EnrichedEvent, PrinterConsumable


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_MODEL_ID = uuid4()


def make_event(code: str, counter: int = 100) -> EnrichedEvent:
    return EnrichedEvent(
        type="ERROR",
        code=code,
        timestamp=datetime(2024, 3, 14, 10, 0, 0),
        counter=counter,
        firmware=None,
        help_reference=None,
        code_severity=None,
        code_description=None,
        code_solution_url=None,
        code_solution_content=None,
    )


def make_consumable(
    part_number: str = "RM2-0001",
    life_pages: int = 150_000,
    related_codes: list[str] | None = None,
    category: str = "roller",
) -> PrinterConsumable:
    return PrinterConsumable(
        id=uuid4(),
        model_id=_MODEL_ID,
        part_number=part_number,
        description=f"Test consumable {part_number}",
        category=category,
        life_pages=life_pages,
        related_codes=related_codes or [],
    )


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


def test_no_consumables_returns_empty():
    events = [make_event("49.38.07", counter=50_000)]
    result = compute_consumable_warnings(events, [], max_counter=50_000)
    assert result == []


def test_no_matching_codes_still_returns_consumable():
    """Consumables with no log code match are still included, with empty matched_codes."""
    events = [make_event("13.20.00", counter=50_000)]
    consumables = [make_consumable(related_codes=["49.38.07"])]
    result = compute_consumable_warnings(events, consumables, max_counter=50_000)
    assert len(result) == 1
    assert result[0].matched_codes == []


def test_wildcard_z_matches_hex_digit():
    """53.B0.0z should match 53.B0.02 and 53.B0.0A but not 53.B0.10."""
    events = [
        make_event("53.B0.02", counter=100_000),
        make_event("53.B0.0A", counter=100_000),
        make_event("53.B0.10", counter=100_000),
    ]
    consumables = [make_consumable(related_codes=["53.B0.0z"])]
    result = compute_consumable_warnings(events, consumables, max_counter=100_000)
    assert len(result) == 1
    assert set(result[0].matched_codes) == {"53.B0.02", "53.B0.0A"}
    assert "53.B0.10" not in result[0].matched_codes


def test_status_replace_when_over_100_pct():
    events = [make_event("49.38.07", counter=200_000)]
    consumables = [make_consumable(life_pages=150_000, related_codes=["49.38.07"])]
    result = compute_consumable_warnings(events, consumables, max_counter=200_000)
    assert len(result) == 1
    assert result[0].status == "replace"
    assert result[0].usage_pct > 100


def test_status_warning_between_80_and_100():
    # 130_000 / 150_000 = 86.67%
    events = [make_event("49.38.07", counter=130_000)]
    consumables = [make_consumable(life_pages=150_000, related_codes=["49.38.07"])]
    result = compute_consumable_warnings(events, consumables, max_counter=130_000)
    assert len(result) == 1
    assert result[0].status == "warning"
    assert 80.0 <= result[0].usage_pct < 100.0


def test_status_ok_below_80():
    # 90_000 / 150_000 = 60%
    events = [make_event("49.38.07", counter=90_000)]
    consumables = [make_consumable(life_pages=150_000, related_codes=["49.38.07"])]
    result = compute_consumable_warnings(events, consumables, max_counter=90_000)
    assert len(result) == 1
    assert result[0].status == "ok"
    assert result[0].usage_pct < 80.0


def test_warnings_sorted_by_usage_pct_desc():
    events = [
        make_event("49.38.07", counter=200_000),
        make_event("13.20.00", counter=200_000),
    ]
    consumables = [
        make_consumable(part_number="LOW-USE", life_pages=500_000, related_codes=["13.20.00"]),
        make_consumable(part_number="HIGH-USE", life_pages=150_000, related_codes=["49.38.07"]),
    ]
    result = compute_consumable_warnings(events, consumables, max_counter=200_000)
    assert len(result) == 2
    assert result[0].part_number == "HIGH-USE"
    assert result[1].part_number == "LOW-USE"
    assert result[0].usage_pct > result[1].usage_pct


def test_max_counter_excludes_zero_counters():
    """If max_counter=0 (all events have counter=0), return empty list."""
    events = [make_event("49.38.07", counter=0)]
    consumables = [make_consumable(related_codes=["49.38.07"])]
    result = compute_consumable_warnings(events, consumables, max_counter=0)
    assert result == []


def test_consumable_without_life_pages_is_skipped():
    events = [make_event("49.38.07", counter=50_000)]
    consumable = PrinterConsumable(
        id=uuid4(),
        model_id=_MODEL_ID,
        part_number="NO-LIFE",
        description="No life pages",
        category="other",
        life_pages=None,
        related_codes=["49.38.07"],
    )
    result = compute_consumable_warnings(events, [consumable], max_counter=50_000)
    assert result == []


def test_toner_category_always_excluded():
    """Toner cartridges are excluded even with matched codes and usage_pct > 100%."""
    events = [make_event("10.00.15", counter=200_000)]
    toner = make_consumable(
        part_number="CF237A",
        life_pages=150_000,
        related_codes=["10.00.15"],
        category="toner",
    )
    result = compute_consumable_warnings(events, [toner], max_counter=200_000)
    assert result == []


def test_toner_excluded_even_when_mixed_with_other_categories():
    """Toner is excluded but other categories in the same call are still included."""
    events = [make_event("49.38.07", counter=200_000)]
    toner = make_consumable(part_number="TONER-1", life_pages=150_000, category="toner")
    roller = make_consumable(part_number="ROLLER-1", life_pages=150_000, category="roller")
    result = compute_consumable_warnings(events, [toner, roller], max_counter=200_000)
    part_numbers = [w.part_number for w in result]
    assert "TONER-1" not in part_numbers
    assert "ROLLER-1" in part_numbers


def test_adf_description_excluded():
    """Consumables with 'ADF' in description are excluded regardless of category."""
    events = [make_event("13.20.00", counter=180_000)]
    adf_roller = make_consumable(
        part_number="RM2-ADF-01",
        life_pages=150_000,
        related_codes=["13.20.00"],
        category="roller",
    )
    # Override description to contain ADF
    adf_roller = PrinterConsumable(
        id=adf_roller.id,
        model_id=adf_roller.model_id,
        part_number=adf_roller.part_number,
        description="ADF Pick Up Roller",
        category=adf_roller.category,
        life_pages=adf_roller.life_pages,
        related_codes=adf_roller.related_codes,
    )
    result = compute_consumable_warnings(events, [adf_roller], max_counter=180_000)
    assert result == []


def test_document_feeder_description_excluded():
    """Consumables with 'Document Feeder' in description are excluded."""
    events = [make_event("13.20.00", counter=180_000)]
    adf_roller = PrinterConsumable(
        id=uuid4(),
        model_id=_MODEL_ID,
        part_number="RM2-DOC-01",
        description="Document Feeder Separation Roller",
        category="roller",
        life_pages=150_000,
        related_codes=["13.20.00"],
    )
    result = compute_consumable_warnings(events, [adf_roller], max_counter=180_000)
    assert result == []


def test_adf_excluded_but_regular_roller_included():
    """ADF roller is excluded while a regular roller in the same call is included."""
    events = [make_event("13.20.00", counter=180_000)]
    adf_roller = PrinterConsumable(
        id=uuid4(),
        model_id=_MODEL_ID,
        part_number="ADF-ROLLER",
        description="ADF Roller Kit",
        category="roller",
        life_pages=150_000,
        related_codes=["13.20.00"],
    )
    regular_roller = make_consumable(
        part_number="REGULAR-ROLLER",
        life_pages=150_000,
        related_codes=["13.20.00"],
        category="roller",
    )
    result = compute_consumable_warnings(events, [adf_roller, regular_roller], max_counter=180_000)
    part_numbers = [w.part_number for w in result]
    assert "ADF-ROLLER" not in part_numbers
    assert "REGULAR-ROLLER" in part_numbers
