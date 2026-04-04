"""Robust parser for HP printer logs with validation and error tolerance."""

from __future__ import annotations

import logging
import pathlib
from dataclasses import dataclass
from datetime import datetime
from typing import Iterable, List

from backend.domain.entities import Event

logger = logging.getLogger(__name__)

DATE_FORMAT = "%d-%b-%Y %H:%M:%S"

_ES_MONTHS = {
    "ene": "Jan", "feb": "Feb", "mar": "Mar", "abr": "Apr",
    "may": "May", "jun": "Jun", "jul": "Jul", "ago": "Aug",
    "sep": "Sep", "oct": "Oct", "nov": "Nov", "dic": "Dec",
}
HEADER_KEYWORDS = {"tipo", "type", "código", "codigo", "fecha", "date"}
TYPE_MAP = {"error": "ERROR", "warning": "WARNING", "info": "INFO"}


@dataclass(frozen=True)
class ParserError:
    """Non-fatal parsing issue tracked for observability."""

    line_number: int
    raw_line: str
    reason: str


@dataclass
class ParserReport:
    """Collects parser output for downstream analysis."""

    events: List[Event]
    errors: List[ParserError]

    def valid_ratio(self) -> float:
        """Return percentage of successfully parsed lines."""
        total = len(self.events) + len(self.errors)
        return 1.0 if total == 0 else len(self.events) / total


class LogParser:
    """Parse HP printer logs into immutable Event entities."""

    def __init__(self, strict: bool = False) -> None:
        self.strict = strict

    def parse_text(self, payload: str) -> ParserReport:
        """Parse raw text content."""
        lines = payload.splitlines()
        return self._parse_lines(lines)

    def parse_file(self, file_path: pathlib.Path) -> ParserReport:
        """Parse logs directly from a file."""
        content = file_path.read_text(encoding="utf-8")
        return self.parse_text(content)

    def _parse_lines(self, lines: Iterable[str]) -> ParserReport:
        events: List[Event] = []
        errors: List[ParserError] = []
        non_empty_count = 0

        for idx, raw_line in enumerate(lines, start=1):
            line = raw_line.strip()
            if not line:
                continue

            non_empty_count += 1
            try:
                event = self._parse_line(line, is_candidate_header=non_empty_count <= 3)
                if event:
                    events.append(event)
            except ValueError as exc:
                if str(exc) == "Header row skipped":
                    continue
                error = ParserError(line_number=idx, raw_line=line, reason=str(exc))
                errors.append(error)
                logger.debug(
                    "Skipped line %d — %s | raw: %r",
                    idx,
                    str(exc),
                    line,
                )
                if self.strict:
                    raise

        return ParserReport(events=events, errors=errors)

    def _parse_line(self, line: str, is_candidate_header: bool) -> Event | None:
        """Parse an individual log line (TSV or space-separated with date+time)."""
        # Strip trailing empty fields produced by a trailing tab
        raw_parts = [s.strip() for s in line.split("\t")]
        parts = [p for p in raw_parts if p] if len(raw_parts) > 1 else raw_parts
        # Restore to exactly 6 slots (pad with empty string for optional help field)
        if len(parts) == 5:
            parts.append("")
        if len(parts) < 6:
            # Fallback: columnas separadas por espacios (fecha y hora = dos tokens)
            tokens = line.split()
            if len(tokens) >= 6:
                # type, code, date, time, counter, firmware [, help...]
                parts = [
                    tokens[0],
                    tokens[1],
                    f"{tokens[2]} {tokens[3]}",
                    tokens[4],
                    tokens[5],
                    " ".join(tokens[6:]) if len(tokens) > 6 else "",
                ]
            else:
                raise ValueError("Expected 6 tab-separated columns (or 6+ space-separated: type code date time counter firmware [help])")
        if is_candidate_header and self._looks_like_header(parts):
            raise ValueError("Header row skipped")

        event_type = self._normalize_type(parts[0])
        code = parts[1]
        timestamp = self._parse_timestamp(parts[2])
        counter = self._parse_counter(parts[3])
        firmware = parts[4] or None
        help_reference = parts[5] or None

        return Event(
            type=event_type,
            code=code,
            timestamp=timestamp,
            counter=counter,
            firmware=firmware,
            help_reference=help_reference,
        )

    @staticmethod
    def _parse_timestamp(value: str) -> datetime:
        normalized = LogParser._normalize_timestamp_text(value)
        try:
            return datetime.strptime(normalized, DATE_FORMAT)
        except ValueError as exc:
            raise ValueError(f"Timestamp must follow {DATE_FORMAT}") from exc

    @staticmethod
    def _parse_counter(value: str) -> int:
        cleaned = value.strip()
        if not cleaned.isdigit():
            raise ValueError("Counter must be a positive integer")
        return int(cleaned)

    @staticmethod
    def _normalize_timestamp_text(value: str) -> str:
        """Ensure month abbreviations parse with the English locale."""
        value = value.strip()
        if " " not in value:
            raise ValueError("Timestamp must include date and time")
        date_part, time_part = value.split(" ", 1)
        try:
            day, month, year = date_part.split("-")
        except ValueError as exc:
            raise ValueError("Date portion must be DD-MMM-YYYY") from exc
        month = _ES_MONTHS.get(month.lower(), month)
        month = month[:1].upper() + month[1:].lower()
        time_str = time_part.strip()
        if len(time_str) > 0 and time_str[1:2] == ":":
            time_str = "0" + time_str
        return f"{day}-{month}-{year} {time_str}"

    @staticmethod
    def _normalize_type(value: str) -> str:
        normalized = TYPE_MAP.get(value.strip().lower())
        if not normalized:
            raise ValueError(f"Unsupported event type: {value}")
        return normalized

    @staticmethod
    def _looks_like_header(parts: List[str]) -> bool:
        if not parts:
            return False
        joined = " ".join(parts).lower()
        return any(keyword in joined for keyword in HEADER_KEYWORDS)
