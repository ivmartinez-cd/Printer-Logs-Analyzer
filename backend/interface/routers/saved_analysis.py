from fastapi import APIRouter, Depends, HTTPException
from typing import List
from uuid import UUID
from datetime import datetime, timezone
from backend.interface.schemas.saved_analysis import (
    SavedAnalysisCreateRequest, 
    SavedAnalysisIncidentItem, 
    CompareLogsRequest
)
from backend.interface.schemas.analysis import ParserErrorModel
from backend.interface.deps import (
    get_saved_analysis_repo, 
    get_log_parser, 
    get_error_code_repo, 
    get_analysis_service
)
from backend.interface.auth import authenticate
from backend.interface.utils import normalize_log_text, enrich_events_with_catalog, incident_to_summary
from backend.infrastructure.repositories.saved_analysis_repository import SavedAnalysisRepository, SavedAnalysisSnapshot
from backend.infrastructure.repositories.error_code_repository import ErrorCodeRepository, ErrorCode
from backend.application.parsers.log_parser import LogParser
from backend.application.services.analysis_service import AnalysisService
from backend.application.services.compare_service import calculate_trend
from backend.domain.entities import Incident, Event, EnrichedEvent

router = APIRouter(prefix="/saved-analyses", tags=["Saved Analyses"])


def _compute_diff(saved: SavedAnalysisSnapshot, current_incidents: List[Incident]) -> dict:
    saved_codes = {i["code"]: i for i in saved.incidents}
    current_by_code = {inc.code: inc for inc in current_incidents}
    current_codes = set(current_by_code.keys())
    saved_codes_set = set(saved_codes.keys())

    codigos_nuevos = list(current_codes - saved_codes_set)
    codigos_desaparecidos = list(saved_codes_set - current_codes)
    cambios_ocurrencias = []
    for code in saved_codes_set & current_codes:
        so = saved_codes[code].get("occurrences") or 0
        co = current_by_code[code].occurrences
        if so != co:
            cambios_ocurrencias.append({
                "code": code,
                "saved_occurrences": so,
                "current_occurrences": co,
                "delta": co - so,
            })

    now = datetime.now(timezone.utc)
    saved_dt = saved.created_at.replace(tzinfo=timezone.utc) if saved.created_at.tzinfo is None else saved.created_at
    diferencia_dias = max(0, int((now - saved_dt).total_seconds() / 86400))

    return {
        "codigos_nuevos": codigos_nuevos,
        "codigos_desaparecidos": codigos_desaparecidos,
        "cambios_ocurrencias": cambios_ocurrencias,
        "diferencia_dias": diferencia_dias,
    }

@router.post("", dependencies=[Depends(authenticate)])
def create_saved_analysis(
    body: SavedAnalysisCreateRequest,
    repo: SavedAnalysisRepository = Depends(get_saved_analysis_repo)
) -> dict:
    incidents_payload = [incident_to_summary(i) for i in body.incidents]
    snap = repo.create(
        name=body.name,
        equipment_identifier=body.equipment_identifier,
        incidents=incidents_payload,
        global_severity=body.global_severity,
    )
    return {
        "id": str(snap.id),
        "name": snap.name,
        "equipment_identifier": snap.equipment_identifier,
        "global_severity": snap.global_severity,
        "created_at": snap.created_at.isoformat(),
    }

@router.get("", dependencies=[Depends(authenticate)])
def list_saved_analyses(repo: SavedAnalysisRepository = Depends(get_saved_analysis_repo)) -> list:
    items = repo.list()
    return [
        {
            "id": str(s.id),
            "name": s.name,
            "equipment_identifier": s.equipment_identifier,
            "global_severity": s.global_severity,
            "created_at": s.created_at.isoformat(),
        }
        for s in items
    ]

@router.get("/{id}", dependencies=[Depends(authenticate)])
def get_saved_analysis(id: str, repo: SavedAnalysisRepository = Depends(get_saved_analysis_repo)) -> dict:
    try:
        uid = UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid id")
    snap = repo.get_by_id(uid)
    if not snap:
        raise HTTPException(status_code=404, detail="Saved analysis not found")
    return {
        "id": str(snap.id),
        "name": snap.name,
        "equipment_identifier": snap.equipment_identifier,
        "incidents": snap.incidents,
        "global_severity": snap.global_severity,
        "created_at": snap.created_at.isoformat(),
    }

@router.delete("/{id}", status_code=204, dependencies=[Depends(authenticate)])
def delete_saved_analysis(id: str, repo: SavedAnalysisRepository = Depends(get_saved_analysis_repo)) -> None:
    try:
        uid = UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid id")
    if not repo.delete(uid):
        raise HTTPException(status_code=404, detail="Saved analysis not found")

@router.post("/{id}/compare", dependencies=[Depends(authenticate)])
def compare_saved_analysis(
    id: str, 
    body: CompareLogsRequest,
    repo: SavedAnalysisRepository = Depends(get_saved_analysis_repo),
    parser: LogParser = Depends(get_log_parser),
    error_repo: ErrorCodeRepository = Depends(get_error_code_repo),
    analysis_service: AnalysisService = Depends(get_analysis_service)
) -> dict:
    try:
        uid = UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid id")
    snap = repo.get_by_id(uid)
    if not snap:
        raise HTTPException(status_code=404, detail="Saved analysis not found")

    report = parser.parse_text(normalize_log_text(body.logs))
    unique_codes = list(dict.fromkeys(e.code for e in report.events))
    catalog_map = error_repo.get_by_codes(unique_codes)
    events = enrich_events_with_catalog(report.events, catalog_map)
    analysis = analysis_service.analyze(events)

    diff = _compute_diff(snap, analysis.incidents)
    diff["tendencia"] = calculate_trend(snap.incidents, analysis.incidents, diff)

    return {
        "saved": {
            "id": str(snap.id),
            "name": snap.name,
            "equipment_identifier": snap.equipment_identifier,
            "incidents": snap.incidents,
            "global_severity": snap.global_severity,
            "created_at": snap.created_at.isoformat(),
        },
        "current": {
            "events": [e.model_dump() for e in events],
            "incidents": [i.model_dump() for i in analysis.incidents],
            "global_severity": analysis.global_severity,
            "errors": [e.model_dump() for e in report.errors],
        },
        "diff": diff,
    }
