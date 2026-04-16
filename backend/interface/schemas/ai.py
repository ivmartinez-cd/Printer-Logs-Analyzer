from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class AiDiagnoseIncidentItem(BaseModel):
    """Incidente compacto para diagnóstico AI (sin eventos individuales)."""

    code: str
    description: Optional[str] = None
    severity: str
    occurrences: int
    start_time: str
    end_time: str
    pattern: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "code": "42.01.01",
                    "description": "Fuser failure",
                    "severity": "ERROR",
                    "occurrences": 3,
                    "start_time": "2026-04-16T08:00:00Z",
                    "end_time": "2026-04-16T09:00:00Z"
                }
            ]
        }
    }


class AiDiagnoseMetadata(BaseModel):
    """Metadatos del análisis para darle contexto al modelo."""

    total_events: Optional[int] = None
    date_range: Optional[str] = None
    firmware: Optional[str] = None
    counter_range: Optional[List[int]] = None
    consumables: Optional[List[Dict[str, Any]]] = None
    alerts_history: Optional[List[Dict[str, Any]]] = None
    meters_pattern: Optional[List[Dict[str, Any]]] = None


class AiDiagnoseRequest(BaseModel):
    """Body para POST /analysis/ai-diagnose."""

    incidents: List[AiDiagnoseIncidentItem]
    global_severity: str
    metadata: Optional[AiDiagnoseMetadata] = None


class AiDiagnoseResponse(BaseModel):
    """Respuesta del diagnóstico AI."""

    diagnosis: str
    model: str
    tokens_used: Dict[str, int]
    cost_usd: float
