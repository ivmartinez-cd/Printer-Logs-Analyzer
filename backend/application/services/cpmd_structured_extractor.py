"""Deterministic regex-based extractor for HP CPMD error blocks.

Replaces the Claude Haiku call for the vast majority of blocks.
Each block gets a `confidence_score` (0.0 – 1.0). Blocks below the
configured threshold should be escalated to the LLM fallback.

Public API:
  - extract_one(block) → ExtractionResult
  - extract_all(blocks) → List[ExtractionResult]
  - partition_by_confidence(results, threshold) → (high, low)
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

from backend.application.services.cpmd_extractor import ExtractedSolution
from backend.application.services.cpmd_parser import ErrorBlock

# ---------------------------------------------------------------------------
# Confidence weights  (must sum to 1.0)
# ---------------------------------------------------------------------------

_W_CAUSE = 0.35        # cause extracted and has substance
_W_STEPS = 0.35        # at least one technician step found
_W_STEP_LEN = 0.15     # at least one step is long enough to be real
_W_FRUS = 0.15         # FRUs block parsed (only counted when FRU markers exist)

_MIN_CAUSE_LEN = 30    # chars
_MIN_STEP_LEN = 15     # chars

# ---------------------------------------------------------------------------
# Compiled regexes
# ---------------------------------------------------------------------------

# Marks where the actionable section starts
_SERVICE_SECTION_RE = re.compile(
    r"Recommended\s+action\s+for\s+service\b",
    re.IGNORECASE,
)
_CUSTOMERS_SECTION_RE = re.compile(
    r"Recommended\s+action\s+for\s+customers?\b",
    re.IGNORECASE,
)

# Numbered steps: "1. Text" or "1) Text"
_NUMBERED_STEP_RE = re.compile(r"^\s*\d+[.)]\s+(.+)", re.MULTILINE)

# FRU / Spare parts section markers
_FRU_SECTION_RE = re.compile(
    r"(?:FRUs?|Spare\s+parts?)\s*\n",
    re.IGNORECASE,
)

# HP part number patterns (several families co-exist in CPMDs):
#   RM2-1256-000  →  [A-Z]{1,3} + digit(s) + dash + 4 digits + dash + 3 digits
#   B5L35-67901   →  1 letter + alphanumeric suffix + dash + 5 digits
#   CF237-67901   →  2 letters + digits + dash + 5 digits
#   J8J70-67903   →  letter + mixed alphanumeric + dash + 5 digits
# Unified: 1-3 uppercase letters, followed by 0-5 alphanumeric chars, dash, 4-6 digits,
# optionally another dash + 3 digits.
_PART_NUMBER_RE = re.compile(
    r"\b([A-Z]{1,3}[A-Z0-9]{0,5}-\d{4,6}(?:-\d{3})?)\b"
)

# Page markers injected by the PDF reader, noise for extraction
_PAGE_MARKER_RE = re.compile(r"<<<PAGE\s+\d+>>>")

# Collapse whitespace runs
_WS_RE = re.compile(r"[ \t]+")

# Lines that are clearly headers or noise (all caps short line, only numbers, etc.)
_NOISE_LINE_RE = re.compile(r"^[\s\d.()]+$")


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------


@dataclass
class ExtractionResult:
    """Result of a deterministic extraction attempt on a single ErrorBlock."""

    block: ErrorBlock
    solution: Optional[ExtractedSolution]
    confidence_score: float  # 0.0 – 1.0
    has_fru_marker: bool = False  # True if the block contained a FRU section marker


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def extract_one(block: ErrorBlock) -> ExtractionResult:
    """Try to extract structured fields from *block* using regex heuristics.

    Always returns an ExtractionResult. `solution` is None only if the block
    is completely unparseable (extremely rare). The caller should check
    `confidence_score` to decide whether to escalate to the LLM.
    """
    clean = _clean_text(block.raw_text)

    cause = _extract_cause(clean, block.source_audience)
    steps = _extract_steps(clean, block.source_audience)
    frus, has_fru_marker = _extract_frus(clean)

    score = _compute_score(cause, steps, frus, has_fru_marker)

    solution = ExtractedSolution(
        code=block.code,
        title=block.raw_title.strip(),
        cause=cause,
        technician_steps=steps,
        frus=frus,
    )

    return ExtractionResult(
        block=block,
        solution=solution,
        confidence_score=score,
        has_fru_marker=has_fru_marker,
    )


def extract_all(blocks: List[ErrorBlock]) -> List[ExtractionResult]:
    """Extract structured data from every block. Pure Python, no I/O."""
    return [extract_one(b) for b in blocks]


def partition_by_confidence(
    results: List[ExtractionResult],
    threshold: float = 0.75,
) -> Tuple[List[ExtractionResult], List[ExtractionResult]]:
    """Split results into (high_confidence, low_confidence) lists.

    High-confidence results are ready to persist as-is.
    Low-confidence results should be escalated to the LLM fallback.
    """
    high = [r for r in results if r.confidence_score >= threshold]
    low = [r for r in results if r.confidence_score < threshold]
    return high, low


# ---------------------------------------------------------------------------
# Private: text cleaning
# ---------------------------------------------------------------------------


def _clean_text(raw: str) -> str:
    """Remove page markers and normalize whitespace."""
    text = _PAGE_MARKER_RE.sub(" ", raw)
    # Normalize horizontal whitespace but preserve newlines
    lines = [_WS_RE.sub(" ", line).strip() for line in text.splitlines()]
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Private: field extractors
# ---------------------------------------------------------------------------


def _extract_cause(text: str, audience: str) -> str:
    """Extract the cause/description paragraph before the action section.

    Strategy:
    1. Find the start of the Recommended action section.
    2. Take the text between the error code header (first line) and that marker.
    3. Clean noise lines and collapse to a single string.
    """
    # Pick the right marker
    action_match = _SERVICE_SECTION_RE.search(text)
    if action_match is None:
        action_match = _CUSTOMERS_SECTION_RE.search(text)

    if action_match is None:
        return ""

    # Everything between the first newline and the action marker is candidate cause
    first_newline = text.find("\n")
    if first_newline == -1:
        return ""

    cause_block = text[first_newline:action_match.start()]
    lines = cause_block.splitlines()

    # Filter noise: skip lines that are empty, all-caps headers, or FRU tables
    kept = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if _NOISE_LINE_RE.match(stripped):
            continue
        # Skip lines that look like table headers or page numbers
        if len(stripped) < 4:
            continue
        # Stop if we hit another section-like header
        if _FRU_SECTION_RE.match(stripped):
            break
        kept.append(stripped)

    return " ".join(kept).strip()


def _extract_steps(text: str, audience: str) -> List[str]:
    """Extract numbered technician steps from the action section.

    Returns at most 5 steps.
    """
    # Locate the start of the action section
    action_match = _SERVICE_SECTION_RE.search(text)
    if action_match is None:
        action_match = _CUSTOMERS_SECTION_RE.search(text)

    if action_match is None:
        return []

    action_text = text[action_match.end():]

    # Stop at a FRU section if present
    fru_match = _FRU_SECTION_RE.search(action_text)
    if fru_match:
        action_text = action_text[: fru_match.start()]

    # Try numbered steps first
    steps = _NUMBERED_STEP_RE.findall(action_text)
    if steps:
        cleaned = [s.strip() for s in steps if s.strip()]
        return cleaned[:5]

    # Fallback: split by sentence-ending punctuation for unnumbered blocks
    sentences = re.split(r"(?<=[.!?])\s+", action_text.strip())
    cleaned = [s.strip() for s in sentences if len(s.strip()) >= _MIN_STEP_LEN]
    return cleaned[:5]


def _extract_frus(text: str) -> Tuple[List[Dict[str, str]], bool]:
    """Extract FRU part numbers and descriptions.

    Returns (frus_list, has_fru_marker).
    `has_fru_marker` is True when the block has a FRU section, regardless
    of whether any part numbers were found.
    """
    fru_match = _FRU_SECTION_RE.search(text)
    if fru_match is None:
        return [], False

    fru_block = text[fru_match.end():]

    frus: List[Dict[str, str]] = []
    lines = fru_block.splitlines()

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        pn_match = _PART_NUMBER_RE.search(stripped)
        if not pn_match:
            continue

        part_number = pn_match.group(1)

        # Description is the rest of the line after the part number, cleaned up
        rest = stripped[pn_match.end():].strip()
        # Sometimes the SKU (shorter code like "CF237A") appears right after the PN
        # Strip it if it matches the short-code pattern
        rest = re.sub(r"^[A-Z]{1,3}\d{4,5}[A-Z]?\s*", "", rest).strip()
        description = rest if len(rest) >= 4 else ""

        frus.append({"part_number": part_number, "description": description})

    return frus, True


# ---------------------------------------------------------------------------
# Private: confidence scoring
# ---------------------------------------------------------------------------


def _compute_score(
    cause: str,
    steps: List[str],
    frus: List[Dict[str, str]],
    has_fru_marker: bool,
) -> float:
    """Compute a confidence score in [0.0, 1.0].

    Scoring table:
      +0.35  cause has >= 30 chars
      +0.35  at least 1 technician step found
      +0.15  at least 1 step is >= 15 chars (quality signal)
      +0.15  FRU section: either parsed correctly OR no FRU marker present
             (if there IS a marker but we got 0 FRUs, we penalize)
    """
    score = 0.0

    if len(cause) >= _MIN_CAUSE_LEN:
        score += _W_CAUSE

    if steps:
        score += _W_STEPS
        if any(len(s) >= _MIN_STEP_LEN for s in steps):
            score += _W_STEP_LEN

    # FRU scoring: if there's no FRU section we give full credit (nothing to parse).
    # If there IS a FRU section we give credit only if we extracted something.
    if not has_fru_marker or frus:
        score += _W_FRUS

    return round(min(score, 1.0), 4)
