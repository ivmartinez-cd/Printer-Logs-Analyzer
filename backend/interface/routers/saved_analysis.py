from datetime import datetime, timezone
from typing import List
from uuid import UUID

from backend.application.parsers.log_parser import LogParser
from backend.application.services.analysis_service import AnalysisService
from backend.application.services.compare_service import calculate_trend
from backend.application.services.degradation_service import evaluate_device_health
from backend.domain.entities import Incident
from backend.infrastructure.repositories.error_code_repository import ErrorCodeRepository
from backend.infrastructure.repositories.maintenance_repository import MaintenanceRepository
from backend.infrastructure.repositories.saved_analysis_repository import (
    SavedAnalysisRepository,
    SavedAnalysisSnapshot,
)
from backend.infrastructure.repositories.telemetry_repository import (
    TelemetryEvent,
    TelemetryRepository,
)
from backend.interface.auth import authenticate
from backend.interface.deps import (
    get_analysis_service,
    get_error_code_repo,
    get_log_parser,
    get_maintenance_repo,
    get_saved_analysis_repo,
    get_telemetry_repo,
)
from backend.interface.schemas.saved_analysis import (
    CompareLogsRequest,
    SavedAnalysisCreateRequest,
)
from backend.interface.utils import (
    enrich_events_with_catalog,
    extract_serial_number,
    incident_to_summary,
    normalize_log_text,
)
from fastapi import APIRouter, Depends, HTTPException

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
            cambios_ocurrencias.append(
                {
                    "code": code,
                    "saved_occurrences": so,
                    "current_occurrences": co,
                    "delta": co - so,
                }
            )

    now = datetime.now(timezone.utc)
    saved_dt = (
        saved.created_at.replace(tzinfo=timezone.utc)
        if saved.created_at.tzinfo is None
        else saved.created_at
    )
    diferencia_dias = max(0, int((now - saved_dt).total_seconds() / 86400))

    return {
        "codigos_nuevos": codigos_nuevos,
        "codigos_desaparecidos": codigos_desaparecidos,
        "cambios_ocurrencias": cambios_ocurrencias,
        "diferencia_dias": diferencia_dias,
    }


@router.post(
    "",
    dependencies=[Depends(authenticate)],
    summary="Create a new saved analysis snapshot",
    response_description="The created analysis metadata.",
)
def create_saved_analysis(
    body: SavedAnalysisCreateRequest,
    repo: SavedAnalysisRepository = Depends(get_saved_analysis_repo),
    telemetry_repo: TelemetryRepository = Depends(get_telemetry_repo),
) -> dict:
    incidents_payload = [incident_to_summary(i) for i in body.incidents]
    snap = repo.create(
        name=body.name,
        equipment_identifier=body.equipment_identifier,
        incidents=incidents_payload,
        global_severity=body.global_severity,
    )
    # Fan out each incident into the per-device telemetry history so the
    # degradation engine can evaluate the device's health over time.
    if body.equipment_identifier:
        clean_serial = extract_serial_number(body.equipment_identifier)
        telemetry_repo.add_events(
            [
                TelemetryEvent(
                    device_serial=clean_serial,
                    saved_analysis_id=snap.id,
                    code=inc.code,
                    classification=inc.classification,
                    severity=inc.severity,
                    occurrences=inc.occurrences,
                    counter=inc.counter_range[-1] if inc.counter_range else 0,
                    event_time=inc.last_event_time or inc.end_time,
                )
                for inc in body.incidents
            ]
        )

    return {
        "id": str(snap.id),
        "name": snap.name,
        "equipment_identifier": snap.equipment_identifier,
        "global_severity": snap.global_severity,
        "created_at": snap.created_at.isoformat(),
    }


@router.get(
    "",
    dependencies=[Depends(authenticate)],
    summary="List all saved analysis snapshots",
    response_description="A list of analysis summaries.",
)
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


@router.get(
    "/{id}",
    dependencies=[Depends(authenticate)],
    summary="Get a specific saved analysis by ID",
    response_description="The full analysis snapshot including incident details.",
)
def get_saved_analysis(
    id: str, repo: SavedAnalysisRepository = Depends(get_saved_analysis_repo)
) -> dict:
    try:
        uid = UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid id") from None
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


@router.get(
    "/{id}/health",
    dependencies=[Depends(authenticate)],
    summary="Evaluate device health/degradation from telemetry history",
    response_description="Device health status, reason and recommendation.",
)
def get_device_health(
    id: str,
    repo: SavedAnalysisRepository = Depends(get_saved_analysis_repo),
    telemetry_repo: TelemetryRepository = Depends(get_telemetry_repo),
    maintenance_repo: MaintenanceRepository = Depends(get_maintenance_repo),
) -> dict:
    try:
        uid = UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid id") from None
    snap = repo.get_by_id(uid)
    if not snap:
        raise HTTPException(status_code=404, detail="Saved analysis not found")

    serial = snap.equipment_identifier
    if not serial:
        return {
            "status": "GREEN",
            "label": "Sin equipo asociado",
            "reason": "El análisis no tiene un identificador de equipo.",
            "recommendation": "Sin acciones requeridas.",
            "triggered_rule": None,
            "events_count": 0,
        }

    clean_serial = extract_serial_number(serial)
    events = telemetry_repo.get_events_by_serial(clean_serial)
    try:
        maintenance = maintenance_repo.get_history(clean_serial)
    except Exception:
        maintenance = []

    health = evaluate_device_health(events, maintenance)
    return {
        "status": health.status,
        "label": health.label,
        "reason": health.reason,
        "recommendation": health.recommendation,
        "triggered_rule": health.triggered_rule,
        "events_count": len(events),
    }



@router.delete(
    "/{id}",
    status_code=204,
    dependencies=[Depends(authenticate)],
    summary="Delete a saved analysis snapshot",
    response_description="No content upon successful deletion.",
)
def delete_saved_analysis(
    id: str,
    repo: SavedAnalysisRepository = Depends(get_saved_analysis_repo),
    telemetry_repo: TelemetryRepository = Depends(get_telemetry_repo),
) -> None:
    try:
        uid = UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid id") from None
    if not repo.delete(uid):
        raise HTTPException(status_code=404, detail="Saved analysis not found")
    telemetry_repo.delete_events_by_analysis(uid)



@router.post(
    "/{id}/compare",
    dependencies=[Depends(authenticate)],
    summary="Compare a saved analysis with a new log file",
    response_description="A comparison result showing new/missing codes and trends.",
)
def compare_saved_analysis(
    id: str,
    body: CompareLogsRequest,
    repo: SavedAnalysisRepository = Depends(get_saved_analysis_repo),
    parser: LogParser = Depends(get_log_parser),
    error_repo: ErrorCodeRepository = Depends(get_error_code_repo),
    analysis_service: AnalysisService = Depends(get_analysis_service),
) -> dict:
    try:
        uid = UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid id") from None
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


@router.put(
    "/{id}",
    dependencies=[Depends(authenticate)],
    summary="Update a saved analysis snapshot with a new log/incidents list",
    response_description="The updated analysis metadata.",
)
def update_saved_analysis(
    id: str,
    body: SavedAnalysisCreateRequest,
    repo: SavedAnalysisRepository = Depends(get_saved_analysis_repo),
    telemetry_repo: TelemetryRepository = Depends(get_telemetry_repo),
) -> dict:
    try:
        uid = UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid id") from None

    incidents_payload = [incident_to_summary(i) for i in body.incidents]
    snap = repo.update(
        id=uid,
        incidents=incidents_payload,
        global_severity=body.global_severity,
    )
    if not snap:
        raise HTTPException(status_code=404, detail="Saved analysis not found")

    # Clean up old telemetry events before appending new ones to prevent duplication
    telemetry_repo.delete_events_by_analysis(uid)

    if body.equipment_identifier:
        clean_serial = extract_serial_number(body.equipment_identifier)
        telemetry_repo.add_events(
            [
                TelemetryEvent(
                    device_serial=clean_serial,
                    saved_analysis_id=snap.id,
                    code=inc.code,
                    classification=inc.classification,
                    severity=inc.severity,
                    occurrences=inc.occurrences,
                    counter=inc.counter_range[-1] if inc.counter_range else 0,
                    event_time=inc.last_event_time or inc.end_time,
                )
                for inc in body.incidents
            ]
        )


    return {
        "id": str(snap.id),
        "name": snap.name,
        "equipment_identifier": snap.equipment_identifier,
        "incidents": snap.incidents,
        "global_severity": snap.global_severity,
        "created_at": snap.created_at.isoformat(),
    }

