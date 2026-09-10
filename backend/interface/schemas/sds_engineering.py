"""Schemas para el módulo de casos de ingeniería SDS (/sds/engineering/*)."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class EngineeringSyncRequest(BaseModel):
    """Body para POST /sds/engineering/sync."""

    states: Optional[List[str]] = None
    severities: Optional[List[str]] = None
    types: Optional[List[str]] = None
    date_from: Optional[str] = None
    date_until: Optional[str] = None
    customer_id: Optional[str] = None
    maxrows: int = 200


class EngineeringSyncResponse(BaseModel):
    fetched: int
    new: int
    updated: int


class EngineeringCaseAnalysisSummary(BaseModel):
    veredicto: str
    confianza: str
    analizado_en: Optional[str] = None
    model: str


class EngineeringCaseItem(BaseModel):
    """Una fila de la cola de ingeniería."""

    incident_id: str
    device_id: str
    serial: str
    customer: Optional[str] = None
    monitor: Optional[str] = None
    model: Optional[str] = None
    firmware: Optional[str] = None
    estado: str
    gravedad: Optional[str] = None
    tipo: Optional[str] = None
    codigo: str
    probabilidad: Optional[int] = None
    plazo_dias: Optional[int] = None
    mediana_dias_a_fallo: Optional[int] = None
    creado: Optional[str] = None
    actualizado: Optional[str] = None
    analisis: Optional[EngineeringCaseAnalysisSummary] = None


class EngineeringCaseListResponse(BaseModel):
    items: List[EngineeringCaseItem]
    total: int


class EngineeringCaseDetailResponse(BaseModel):
    case: EngineeringCaseItem
    detail: Dict[str, Any] = Field(default_factory=dict)
    latest_analysis: Optional[Dict[str, Any]] = None
    analysis_history: List[Dict[str, Any]] = Field(default_factory=list)


class EngineeringIncidentRef(BaseModel):
    device_id: str
    incident_id: str


class EngineeringAnalyzeRequest(BaseModel):
    """Body para POST /sds/engineering/analyze."""

    scope: str = "new"  # new | open | selection
    incidents: Optional[List[EngineeringIncidentRef]] = None
    force: bool = False
    include_logs: bool = True
    include_cds: bool = True

    model_config = {
        "json_schema_extra": {"examples": [{"scope": "new"}]}
    }


class EngineeringAnalyzeJobResponse(BaseModel):
    job_id: str
    total: int
    status: str = "running"
    notification_id: Optional[str] = None


class EngineeringCodeStat(BaseModel):
    code: str
    total: int
    abiertos: int
    cerrados: int
