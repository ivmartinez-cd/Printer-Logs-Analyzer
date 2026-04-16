"""Unit tests for cpmd_parser.parse_error_blocks_from_text."""

from __future__ import annotations

from backend.application.services.cpmd_parser import parse_error_blocks_from_text

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

# Minimal CPMD-like text with three blocks:
#   - 13.B2.00  → service section only
#   - 53.A0.01  → both sections (service takes priority)
#   - 21.X0.00  → customers section only
# Plus a TOC entry that must be filtered out.
_FIXTURE_TEXT = """\

<<<PAGE 1>>>
Table of Contents
13.B2.00 Paper jam in Tray 1........
53.A0.01 Fuser error........
21.X0.00 Door open error........

<<<PAGE 5>>>

13.B2.00 Paper jam in Tray 1
This error occurs when paper fails to advance through the tray pickup mechanism.
Cause: worn pickup roller cannot grip the media.

Recommended action for service
1. Remove the tray and inspect the pickup roller.
2. Replace the roller if worn (part CE538-67905).
3. Run a test print to verify the fix.

<<<PAGE 8>>>

53.A0.01 Fuser temperature error
The fuser assembly has failed to reach operating temperature within the timeout.

Recommended action for service
1. Check the fuser power connector.
2. Replace the fuser if connector is seated correctly (part RM2-5399-000CN).

Recommended action for customers
1. Turn off the printer and wait 30 seconds.
2. Turn on and retry.

<<<PAGE 12>>>

21.X0.00 Front door open
The front door sensor detects the door is open during a print job.

Recommended action for customers
1. Close the front door firmly.
2. Retry the print job.
"""


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


def test_extracts_correct_codes() -> None:
    """Three content blocks (not TOC) should be extracted."""
    blocks = parse_error_blocks_from_text(_FIXTURE_TEXT)
    codes = [b.code for b in blocks]
    assert "13.B2.00" in codes
    assert "53.A0.01" in codes
    assert "21.X0.00" in codes


def test_filters_toc_entries() -> None:
    """TOC entries (followed by '...') must not appear in the output."""
    blocks = parse_error_blocks_from_text(_FIXTURE_TEXT)
    # All codes appear in the TOC — but they also appear as real blocks.
    # The key assertion is that each code appears exactly once.
    codes = [b.code for b in blocks]
    assert codes.count("13.B2.00") == 1
    assert codes.count("53.A0.01") == 1
    assert codes.count("21.X0.00") == 1


def test_service_takes_priority_over_customers() -> None:
    """When both sections exist, source_audience must be 'service'."""
    blocks = parse_error_blocks_from_text(_FIXTURE_TEXT)
    block_53 = next(b for b in blocks if b.code == "53.A0.01")
    assert block_53.source_audience == "service"


def test_service_only_audience() -> None:
    """Block with only a service section reports 'service'."""
    blocks = parse_error_blocks_from_text(_FIXTURE_TEXT)
    block_13 = next(b for b in blocks if b.code == "13.B2.00")
    assert block_13.source_audience == "service"


def test_customers_only_audience() -> None:
    """Block with only a customers section reports 'customers'."""
    blocks = parse_error_blocks_from_text(_FIXTURE_TEXT)
    block_21 = next(b for b in blocks if b.code == "21.X0.00")
    assert block_21.source_audience == "customers"


def test_source_page_is_correct() -> None:
    """source_page reflects the <<<PAGE N>>> marker immediately before the block."""
    blocks = parse_error_blocks_from_text(_FIXTURE_TEXT)
    by_code = {b.code: b for b in blocks}
    assert by_code["13.B2.00"].source_page == 5
    assert by_code["53.A0.01"].source_page == 8
    assert by_code["21.X0.00"].source_page == 12


def test_raw_title_is_stripped() -> None:
    """raw_title should not have leading/trailing whitespace."""
    blocks = parse_error_blocks_from_text(_FIXTURE_TEXT)
    for block in blocks:
        assert block.raw_title == block.raw_title.strip()


def test_block_without_action_section_is_discarded() -> None:
    """A block with no 'Recommended action' section must be discarded."""
    text = """\

<<<PAGE 3>>>

99.A0.00 Some unknown error
This error has no action section at all.
Just some description text.

<<<PAGE 4>>>

13.B2.00 Paper jam in Tray 1
Real content here.

Recommended action for service
1. Replace the roller.
"""
    blocks = parse_error_blocks_from_text(text)
    codes = [b.code for b in blocks]
    assert "99.A0.00" not in codes
    assert "13.B2.00" in codes


def test_raw_text_contains_header_and_body() -> None:
    """raw_text must include the error code header line."""
    blocks = parse_error_blocks_from_text(_FIXTURE_TEXT)
    block_13 = next(b for b in blocks if b.code == "13.B2.00")
    assert "13.B2.00" in block_13.raw_text
    assert "Recommended action for service" in block_13.raw_text
