from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class SavedAnalysisIncidentItem(BaseModel):
    """One incident item for JSONB (resumido, sin events)."""

    code: str
    classification: str
    severity: str
    occurrences: int
    start_time: datetime
    end_time: datetime
    counter_range: List[int]
    sds_link: Optional[str] = None
    last_event_time: Optional[datetime] = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "code": "42.01.01",
                    "classification": "Fuser failure",
                    "severity": "ERROR",
                    "occurrences": 3,
                    "start_time": "2026-04-16T08:00:00Z",
                    "end_time": "2026-04-16T09:00:00Z",
                    "counter_range": [1000, 1005],
                }
            ]
        }
    }


class SavedAnalysisCreateRequest(BaseModel):
    """Body for POST /saved-analyses."""

    name: str
    equipment_identifier: Optional[str] = None
    incidents: List[SavedAnalysisIncidentItem]
    global_severity: str = "INFO"
    ai_diagnosis: Optional[str] = None


class CompareLogsRequest(BaseModel):
    """Body for POST /saved-analyses/{id}/compare."""

    logs: str
