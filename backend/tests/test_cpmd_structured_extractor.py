"""Unit tests for cpmd_structured_extractor — the regex-based extraction engine.

Tests cover:
  - Field extraction (cause, technician_steps, frus)
  - Confidence score computation
  - partition_by_confidence routing
  - Edge cases: no action section, no FRU section, unnumbered steps, empty blocks
"""

from __future__ import annotations

from backend.application.services.cpmd_parser import ErrorBlock
from backend.application.services.cpmd_structured_extractor import (
    extract_all,
    extract_one,
    partition_by_confidence,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_block(
    code: str = "13.B9.00",
    raw_title: str = "Paper jam",
    raw_text: str = "",
    audience: str = "service",
    page: int = 42,
) -> ErrorBlock:
    return ErrorBlock(
        code=code,
        raw_title=raw_title,
        raw_text=raw_text or f"\n{code}   {raw_title}\n",
        source_audience=audience,
        source_page=page,
    )


# ---------------------------------------------------------------------------
# Typical well-formed service block
# ---------------------------------------------------------------------------

_TYPICAL_BLOCK_TEXT = """\

13.B9.00   Fuser jam

The fuser assembly has detected a paper jam during the fusing cycle.
This can be caused by worn fuser rollers or incorrect media type.

Recommended action for service
1. Remove all media from the paper path.
2. Inspect the fuser assembly for worn or damaged rollers.
3. Replace the fuser assembly if damage is detected.
4. Run a test print to verify the fix.
"""

_TYPICAL_FRU_BLOCK_TEXT = """\

50.0A.00   Fuser error

The fuser has failed to reach operating temperature within the specified time.

Recommended action for service
1. Verify that the power cable is securely connected to the printer.
2. Replace the fuser assembly.

FRUs
RM2-1256-000   Fuser Assembly
B5L35-67901    Fuser Kit 220V
"""


class TestTypicalBlock:
    def test_cause_extracted(self):
        block = _make_block(raw_text=_TYPICAL_BLOCK_TEXT)
        result = extract_one(block)
        assert result.solution is not None
        assert len(result.solution.cause) >= 30
        assert (
            "worn fuser rollers" in result.solution.cause.lower()
            or "fusing cycle" in result.solution.cause.lower()
        )

    def test_steps_extracted(self):
        block = _make_block(raw_text=_TYPICAL_BLOCK_TEXT)
        result = extract_one(block)
        steps = result.solution.technician_steps
        assert len(steps) >= 3
        assert any("fuser" in s.lower() for s in steps)

    def test_steps_max_five(self):
        long_text = _TYPICAL_BLOCK_TEXT + "\n".join(f"{i}. Step {i}" for i in range(5, 15))
        block = _make_block(raw_text=long_text)
        result = extract_one(block)
        assert len(result.solution.technician_steps) <= 5

    def test_frus_extracted(self):
        block = _make_block(code="50.0A.00", raw_text=_TYPICAL_FRU_BLOCK_TEXT)
        result = extract_one(block)
        assert result.has_fru_marker
        frus = result.solution.frus
        assert len(frus) >= 1
        pns = {f["part_number"] for f in frus}
        assert "RM2-1256-000" in pns or "B5L35-67901" in pns

    def test_high_confidence_on_complete_block(self):
        block = _make_block(raw_text=_TYPICAL_FRU_BLOCK_TEXT)
        result = extract_one(block)
        assert result.confidence_score >= 0.75

    def test_code_and_title_preserved(self):
        block = _make_block(code="13.B9.00", raw_title="Fuser jam", raw_text=_TYPICAL_BLOCK_TEXT)
        result = extract_one(block)
        assert result.solution.code == "13.B9.00"
        assert result.solution.title == "Fuser jam"


# ---------------------------------------------------------------------------
# Customers block (fallback audience)
# ---------------------------------------------------------------------------

_CUSTOMERS_BLOCK_TEXT = """\

60.0B.00   Tray 2 paper misfeed

The printer has detected a misfeed in Tray 2.

Recommended action for customers
1. Remove all paper from Tray 2.
2. Fan the paper stack and re-insert it.
3. Make sure the paper guides are adjusted correctly.
"""


class TestCustomersBlock:
    def test_steps_extracted_from_customers_section(self):
        block = _make_block(
            code="60.0B.00",
            raw_title="Tray 2 paper misfeed",
            raw_text=_CUSTOMERS_BLOCK_TEXT,
            audience="customers",
        )
        result = extract_one(block)
        assert len(result.solution.technician_steps) >= 2

    def test_no_fru_marker_gives_full_fru_score(self):
        block = _make_block(raw_text=_CUSTOMERS_BLOCK_TEXT, audience="customers")
        result = extract_one(block)
        assert not result.has_fru_marker
        # No FRU marker → full FRU weight credited
        assert result.confidence_score >= 0.75


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------

_NO_ACTION_TEXT = """\

99.FF.FF   Unknown error

Some description here without any recommended action section.
"""

_UNNUMBERED_STEPS_TEXT = """\

53.B1.00   Tray 1 pickup roller error

The pickup roller in Tray 1 is worn or dirty and cannot pick paper reliably.

Recommended action for service
Clean the pickup roller with a lint-free cloth. If the issue persists,
replace the pickup roller kit. Run a test print to confirm.
"""


class TestEdgeCases:
    def test_no_action_section_gives_low_confidence(self):
        block = _make_block(raw_text=_NO_ACTION_TEXT)
        result = extract_one(block)
        assert result.confidence_score < 0.75

    def test_unnumbered_steps_still_extracts_something(self):
        block = _make_block(raw_text=_UNNUMBERED_STEPS_TEXT)
        result = extract_one(block)
        # Should still get some steps from sentence splitting
        assert result.solution.technician_steps is not None

    def test_empty_raw_text_does_not_crash(self):
        block = _make_block(raw_text="\n")
        result = extract_one(block)
        assert result is not None
        assert result.solution is not None  # returns empty solution, not None
        assert result.confidence_score < 0.75

    def test_page_markers_removed_from_cause(self):
        text = _TYPICAL_BLOCK_TEXT.replace(
            "Recommended action for service",
            "<<<PAGE 42>>>\nRecommended action for service",
        )
        block = _make_block(raw_text=text)
        result = extract_one(block)
        assert "<<<PAGE" not in result.solution.cause


# ---------------------------------------------------------------------------
# extract_all
# ---------------------------------------------------------------------------


class TestExtractAll:
    def test_returns_one_result_per_block(self):
        blocks = [
            _make_block(code="A", raw_text=_TYPICAL_BLOCK_TEXT),
            _make_block(code="B", raw_text=_TYPICAL_FRU_BLOCK_TEXT),
            _make_block(code="C", raw_text=_NO_ACTION_TEXT),
        ]
        results = extract_all(blocks)
        assert len(results) == 3

    def test_result_order_matches_block_order(self):
        blocks = [_make_block(code=c) for c in ("X", "Y", "Z")]
        results = extract_all(blocks)
        assert [r.block.code for r in results] == ["X", "Y", "Z"]


# ---------------------------------------------------------------------------
# partition_by_confidence
# ---------------------------------------------------------------------------


class TestPartitionByConfidence:
    def test_splits_correctly(self):
        b_high = _make_block(code="H", raw_text=_TYPICAL_FRU_BLOCK_TEXT)
        b_low = _make_block(code="L", raw_text=_NO_ACTION_TEXT)
        results = extract_all([b_high, b_low])
        high, low = partition_by_confidence(results, threshold=0.75)
        high_codes = {r.block.code for r in high}
        low_codes = {r.block.code for r in low}
        assert "H" in high_codes
        assert "L" in low_codes

    def test_threshold_zero_puts_all_in_high(self):
        blocks = [_make_block(raw_text=_NO_ACTION_TEXT) for _ in range(3)]
        results = extract_all(blocks)
        high, low = partition_by_confidence(results, threshold=0.0)
        assert len(high) == 3
        assert len(low) == 0

    def test_threshold_one_puts_all_in_low(self):
        blocks = [_make_block(raw_text=_TYPICAL_FRU_BLOCK_TEXT) for _ in range(3)]
        results = extract_all(blocks)
        high, low = partition_by_confidence(results, threshold=1.01)
        assert len(high) == 0
        assert len(low) == 3

    def test_default_threshold_is_0_75(self):
        """Calling without threshold= should use 0.75."""
        block = _make_block(raw_text=_TYPICAL_FRU_BLOCK_TEXT)
        results = extract_all([block])
        high, low = partition_by_confidence(results)
        # A complete block should land in high
        assert len(high) == 1


# ---------------------------------------------------------------------------
# Confidence score arithmetic
# ---------------------------------------------------------------------------


class TestConfidenceScore:
    def test_score_in_valid_range(self):
        for text in [_TYPICAL_BLOCK_TEXT, _TYPICAL_FRU_BLOCK_TEXT, _NO_ACTION_TEXT, "\n"]:
            block = _make_block(raw_text=text)
            result = extract_one(block)
            assert 0.0 <= result.confidence_score <= 1.0

    def test_complete_block_has_high_score(self):
        block = _make_block(raw_text=_TYPICAL_FRU_BLOCK_TEXT)
        result = extract_one(block)
        assert result.confidence_score >= 0.85

    def test_missing_cause_lowers_score(self):
        no_cause = "\n50.00.00   Error\n\nRecommended action for service\n1. Replace the fuser.\n"
        block = _make_block(raw_text=no_cause)
        result = extract_one(block)
        # cause is missing → should lose the cause weight
        assert result.confidence_score < 0.85
