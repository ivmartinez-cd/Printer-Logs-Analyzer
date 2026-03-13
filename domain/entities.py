"""Domain entities representing core HP printer log concepts."""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class Event(BaseModel):
    """Immutable printer log event."""

    type: str = Field(..., description="Category of the log entry")
    code: str = Field(..., description="Device-specific code reported in the log")
    timestamp: datetime = Field(..., description="Event timestamp parsed from DD-MMM-YYYY HH:mm:ss")
    counter: int = Field(..., description="Device counter at the time of the event")
    firmware: Optional[str] = Field(None, description="Firmware version tagged in the log")
    help_reference: Optional[str] = Field(None, description="Optional troubleshooting hint or URL")

    model_config = {"frozen": True}


class Incident(BaseModel):
    """Aggregates one or many events into an actionable incident."""

    id: str
    code: str
    classification: str
    severity: str = Field(..., description="INFO, WARNING or ERROR from event type")
    severity_weight: int = Field(..., description="Numeric score for sorting (1=INFO, 2=WARNING, 3=ERROR)")
    occurrences: int
    start_time: datetime
    end_time: datetime
    counter_range: tuple[int, int]
    events: List[Event]
    sds_link: Optional[str] = None

    model_config = {"frozen": True}


class AnalysisResult(BaseModel):
    """Result of running analysis rules over a collection of events."""

    incidents: List[Incident]
    global_severity: str = "INFO"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: dict = Field(default_factory=dict)

    model_config = {"frozen": True}
