"""Parser for HP CPMD (Customer Product Maintenance Documents) in PDF format.

Extracts raw error blocks from PDF text, ready to be sent to an LLM for
structured extraction.  The public surface is two functions:

  - extract_text_with_pages(pdf_bytes) → raw text with <<<PAGE N>>> markers
  - parse_error_blocks_from_text(text)  → List[ErrorBlock]
  - extract_error_blocks(pdf_bytes)     → thin wrapper calling both
"""

from __future__ import annotations

import io
import re
from dataclasses import dataclass
from typing import List, Optional

from pypdf import PdfReader

# ---------------------------------------------------------------------------
# Data class
# ---------------------------------------------------------------------------


@dataclass
class ErrorBlock:
    """Raw block extracted from a CPMD PDF for a single error code."""

    code: str
    raw_title: str
    raw_text: str  # full block: header + body (cause + action section)
    source_audience: str  # 'service' | 'customers'
    source_page: Optional[int]


# ---------------------------------------------------------------------------
# Compiled regexes
# ---------------------------------------------------------------------------

# Error code header: "NN.XX.YY   Title text"
# Digits: 2 decimal digits; subfields: hex digits or W/X/Y/Z wildcards
_HEADER_RE = re.compile(
    r"\n(\d{2}\.[A-F0-9WXYZwxyz]{2}\.[A-F0-9WXYZwxyz]{2})"
    r"\s+([^\n.]{3,120})\n",
    re.IGNORECASE,
)

_PAGE_MARKER_RE = re.compile(r"<<<PAGE (\d+)>>>")

_SERVICE_RE = re.compile(r"Recommended action for service\b", re.IGNORECASE)
_CUSTOMERS_RE = re.compile(r"Recommended action for customers?\b", re.IGNORECASE)

# How many characters after a header match to scan for TOC indicator
_TOC_LOOKAHEAD = 200


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def extract_text_with_pages(pdf_bytes: bytes) -> str:
    """Extract text from a PDF, inserting <<<PAGE N>>> markers between pages."""
    reader = PdfReader(io.BytesIO(pdf_bytes))
    parts: List[str] = []
    for i, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        parts.append(f"\n<<<PAGE {i}>>>\n{text}")
    return "".join(parts)


def parse_error_blocks_from_text(text: str) -> List[ErrorBlock]:
    """Parse error blocks from CPMD text (with <<<PAGE N>>> markers).

    TOC entries (those whose text is immediately followed by '...' within
    200 chars) are discarded.  Blocks without a "Recommended action" section
    are also discarded.
    """
    matches = list(_HEADER_RE.finditer(text))
    blocks: List[ErrorBlock] = []

    for i, match in enumerate(matches):
        # --- TOC filter ---
        lookahead = text[match.end() : match.end() + _TOC_LOOKAHEAD]
        if "..." in lookahead:
            continue

        code = match.group(1).upper()
        raw_title = match.group(2).strip()

        # Block spans from this header to the next (or end of text)
        block_start = match.start()
        block_end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        block_text = text[block_start:block_end]

        # --- Action section detection (service > customers) ---
        audience = _detect_audience(block_text)
        if audience is None:
            continue  # No actionable section → discard

        source_page = _get_source_page(text, match.start())

        blocks.append(
            ErrorBlock(
                code=code,
                raw_title=raw_title,
                raw_text=block_text.strip(),
                source_audience=audience,
                source_page=source_page,
            )
        )

    return blocks


def extract_error_blocks(pdf_bytes: bytes) -> List[ErrorBlock]:
    """End-to-end: extract text from a PDF then parse error blocks."""
    text = extract_text_with_pages(pdf_bytes)
    return parse_error_blocks_from_text(text)


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------


def _detect_audience(block_text: str) -> Optional[str]:
    """Return 'service' or 'customers' based on which action section exists.

    Prioritises 'service'.  Returns None if neither section is found.
    """
    if _SERVICE_RE.search(block_text):
        return "service"
    if _CUSTOMERS_RE.search(block_text):
        return "customers"
    return None


def _get_source_page(text: str, match_start: int) -> Optional[int]:
    """Return the last <<<PAGE N>>> number seen before *match_start*."""
    page_num: Optional[int] = None
    for m in _PAGE_MARKER_RE.finditer(text, 0, match_start):
        page_num = int(m.group(1))
    return page_num
