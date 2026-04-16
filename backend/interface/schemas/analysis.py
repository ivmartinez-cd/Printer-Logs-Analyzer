from __future__ import annotations
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from backend.domain.entities import Event, Incident

class ParserErrorModel(BaseModel):
    """Serializable representation of parser errors."""
    line_number: int
    raw_line: str
    reason: str

class ParseLogsRequest(BaseModel):
    """Request body containing the raw log payload."""
    logs: str
    model_id: Optional[UUID] = None

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
