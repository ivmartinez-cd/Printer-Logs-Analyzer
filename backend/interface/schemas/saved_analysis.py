from __future__ import annotations
from typing import List, Optional
from pydantic import BaseModel

class SavedAnalysisIncidentItem(BaseModel):
    """One incident item for JSONB (resumido, sin events)."""
    code: str
    classification: str
    severity: str
    occurrences: int
    start_time: str
    end_time: str
    counter_range: List[int]
    sds_link: Optional[str] = None
    last_event_time: Optional[str] = None

class SavedAnalysisCreateRequest(BaseModel):
    """Body for POST /saved-analyses."""
    name: str
    equipment_identifier: Optional[str] = None
    incidents: List[SavedAnalysisIncidentItem]
    global_severity: str = "INFO"

class CompareLogsRequest(BaseModel):
    """Body for POST /saved-analyses/{id}/compare."""
    logs: str
