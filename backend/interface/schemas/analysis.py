from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from backend.domain.entities import Event, Incident
from pydantic import BaseModel


class ParserErrorModel(BaseModel):
    """Serializable representation of parser errors."""

    line_number: int
    raw_line: str
    reason: str

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "line_number": 42,
                    "raw_line": "Some bad line",
                    "reason": "Missing timestamp"
                }
            ]
        }
    }


class ParseLogsRequest(BaseModel):
    """Request body containing the raw log payload."""

    logs: str
    model_id: Optional[UUID] = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "logs": "2026-04-16 08:00:00 ERROR 42.01.01 ...",
                    "model_id": "123e4567-e89b-12d3-a456-426614174000"
                }
            ]
        }
    }


class ParseLogsResponse(BaseModel):
    """Parser + analysis response."""

    events: List[Event]
    incidents: List[Incident]
    global_severity: str
    errors: List[ParserErrorModel]
    log_start_date: str
    log_end_date: str
    total_lines: int


class ValidateLogsRequest(BaseModel):
    """Request body for log validation (codes detection)."""

    logs: str


class ValidateLogsResponse(BaseModel):
    """Response of POST /parser/validate."""

    total_lines: int
    codes_detected: List[str]
    codes_new: List[str]
    errors: List[ParserErrorModel]
