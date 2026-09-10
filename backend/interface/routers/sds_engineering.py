"""Router de la cola de incidentes de ingeniería del portal HP SDS.

Fase 1: solo lectura sobre el portal + análisis con IA. Nada de estos endpoints
escribe de vuelta en HP (cerrar/posponer un caso sigue siendo manual, en el
portal).
"""

from __future__ import annotations

import asyncio
import logging
import threading
from typing import Any, Dict, Optional

from backend.application.services.job_tracker import create_job, get_job
from backend.application.services.sds_engineering_service import SdsEngineeringService
from backend.application.services.sds_web_service import SDSWebError
from backend.infrastructure.config import Settings
from backend.infrastructure.repositories.error_code_repository import ErrorCodeRepository
from backend.infrastructure.repositories.notification_repository import NotificationRepository
from backend.infrastructure.repositories.sds_engineering_repository import (
    EngineeringCase,
    SdsEngineeringRepository,
)
from backend.interface.auth import authenticate
from backend.interface.deps import (
    get_error_code_repo,
    get_notification_repo,
    get_sds_engineering_repo,
    get_settings,
)
from backend.interface.rate_limiter import limiter
from backend.interface.schemas.sds_engineering import (
    EngineeringAnalyzeJobResponse,
    EngineeringAnalyzeRequest,
    EngineeringCaseAnalysisSummary,
    EngineeringCaseDetailResponse,
    EngineeringCaseItem,
    EngineeringCaseListResponse,
    EngineeringCodeStat,
    EngineeringSyncRequest,
    EngineeringSyncResponse,
)
from fastapi import APIRouter, Depends, HTTPException, Query, Request

router = APIRouter(prefix="/sds/engineering", tags=["SDS Engineering"])
_logger = logging.getLogger(__name__)


def _require_sds_configured(settings: Settings) -> None:
    if not (settings.sds_web_username and settings.sds_web_password):
        raise HTTPException(status_code=503, detail="Integración SDS Web no configurada")


def _get_service(
    settings: Settings,
    repo: SdsEngineeringRepository,
    error_code_repo: ErrorCodeRepository,
    notification_repo: Optional[NotificationRepository] = None,
) -> SdsEngineeringService:
    return SdsEngineeringService(
        settings=settings,
        repo=repo,
        error_code_repo=error_code_repo,
        notification_repo=notification_repo,
    )


def _case_to_item(case: EngineeringCase, analysis=None) -> EngineeringCaseItem:
    summary = None
    if analysis is not None:
        summary = EngineeringCaseAnalysisSummary(
            veredicto=analysis.veredicto,
            confianza=analysis.confianza,
            analizado_en=analysis.created_at.isoformat() if analysis.created_at else None,
            model=analysis.model,
        )
    return EngineeringCaseItem(
        incident_id=case.incident_id,
        device_id=case.device_id,
        serial=case.serial,
        customer=case.customer_name,
        monitor=case.monitor_name,
        model=case.model,
        firmware=case.firmware,
        estado=case.state,
        gravedad=case.severity,
        tipo=case.case_type,
        codigo=case.code,
        probabilidad=case.probability,
        plazo_dias=case.lead_days,
        mediana_dias_a_fallo=case.median_days_to_failure,
        creado=case.created_at_portal.isoformat() if case.created_at_portal else None,
        actualizado=case.updated_at_portal.isoformat() if case.updated_at_portal else None,
        analisis=summary,
    )


@router.post(
    "/sync",
    response_model=EngineeringSyncResponse,
    dependencies=[Depends(authenticate)],
    summary="Sincroniza la cola de incidentes de ingeniería del portal HP SDS",
)
@limiter.limit("6/minute")
async def sync_engineering_cases(
    request: Request,
    body: EngineeringSyncRequest,
    settings: Settings = Depends(get_settings),
    repo: SdsEngineeringRepository = Depends(get_sds_engineering_repo),
    error_code_repo: ErrorCodeRepository = Depends(get_error_code_repo),
) -> EngineeringSyncResponse:
    _require_sds_configured(settings)
    service = _get_service(settings, repo, error_code_repo)

    def _do_sync():
        return service.sync_cases(
            states=body.states,
            severities=body.severities,
            types=body.types,
            date_from=body.date_from,
            date_until=body.date_until,
            customer_id=body.customer_id,
            maxrows=body.maxrows,
        )

    try:
        result = await asyncio.wait_for(asyncio.to_thread(_do_sync), timeout=45.0)
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=504, detail="La sincronización con el portal SDS tardó demasiado."
        ) from None
    except SDSWebError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return EngineeringSyncResponse(**result)


@router.get(
    "/cases",
    response_model=EngineeringCaseListResponse,
    dependencies=[Depends(authenticate)],
    summary="Lista la cola de incidentes de ingeniería (snapshot local)",
)
@limiter.limit("60/minute")
async def list_engineering_cases(
    request: Request,
    state: Optional[list[str]] = Query(default=None),
    severity: Optional[list[str]] = Query(default=None),
    code: Optional[list[str]] = Query(default=None),
    serial: Optional[str] = None,
    only_unanalyzed: bool = False,
    limit: int = 200,
    offset: int = 0,
    repo: SdsEngineeringRepository = Depends(get_sds_engineering_repo),
) -> EngineeringCaseListResponse:
    cases = await asyncio.to_thread(
        repo.list_cases,
        state or ["New", "Open", "Postponed"],
        severity,
        code,
        serial,
        only_unanalyzed,
        limit,
        offset,
    )
    analyses = await asyncio.to_thread(repo.get_latest_analyses, [c.id for c in cases])
    items = [_case_to_item(c, analyses.get(c.id)) for c in cases]
    return EngineeringCaseListResponse(items=items, total=len(items))


@router.get(
    "/cases/{device_id}/{incident_id}",
    response_model=EngineeringCaseDetailResponse,
    dependencies=[Depends(authenticate)],
    summary="Detalle de un caso de ingeniería + historial de análisis",
)
@limiter.limit("30/minute")
async def get_engineering_case_detail(
    request: Request,
    device_id: str,
    incident_id: str,
    refresh: bool = False,
    settings: Settings = Depends(get_settings),
    repo: SdsEngineeringRepository = Depends(get_sds_engineering_repo),
    error_code_repo: ErrorCodeRepository = Depends(get_error_code_repo),
) -> EngineeringCaseDetailResponse:
    case = await asyncio.to_thread(repo.get_case, device_id, incident_id)
    if not case:
        raise HTTPException(status_code=404, detail="Caso no encontrado")

    if refresh or not case.detail:
        _require_sds_configured(settings)
        service = _get_service(settings, repo, error_code_repo)
        try:
            detail = await asyncio.wait_for(
                asyncio.to_thread(service.fetch_detail, case, refresh), timeout=20.0
            )
        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=504, detail="La consulta del detalle del caso tardó demasiado."
            ) from None
        except SDSWebError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc
    else:
        detail = case.detail

    history = await asyncio.to_thread(repo.get_analysis_history, case.id)
    latest = history[0] if history else None

    return EngineeringCaseDetailResponse(
        case=_case_to_item(case, latest),
        detail=detail or {},
        latest_analysis=latest.analysis if latest else None,
        analysis_history=[h.analysis for h in history],
    )


@router.post(
    "/analyze",
    response_model=EngineeringAnalyzeJobResponse,
    dependencies=[Depends(authenticate)],
    summary="Dispara el análisis con IA de casos de ingeniería (job en background)",
)
@limiter.limit("4/minute")
async def analyze_engineering_cases(
    request: Request,
    body: EngineeringAnalyzeRequest,
    settings: Settings = Depends(get_settings),
    repo: SdsEngineeringRepository = Depends(get_sds_engineering_repo),
    error_code_repo: ErrorCodeRepository = Depends(get_error_code_repo),
    notification_repo: NotificationRepository = Depends(get_notification_repo),
) -> EngineeringAnalyzeJobResponse:
    if not settings.anthropic_api_key:
        raise HTTPException(status_code=503, detail="ANTHROPIC_API_KEY no configurada.")
    if body.scope not in ("new", "open", "selection"):
        raise HTTPException(status_code=400, detail="scope debe ser 'new', 'open' o 'selection'")
    if body.scope == "selection" and not body.incidents:
        raise HTTPException(status_code=400, detail="scope='selection' requiere 'incidents'")

    pairs = (
        [(i.device_id, i.incident_id) for i in body.incidents] if body.incidents else None
    )

    service = _get_service(settings, repo, error_code_repo, notification_repo)

    def _preview_groups() -> int:
        cases = service._select_cases_for_scope(body.scope, pairs)
        return len({c.device_id for c in cases})

    total_groups = await asyncio.to_thread(_preview_groups)

    job_id = create_job(total_groups)
    notification = notification_repo.create(
        type="sds_engineering_run",
        title="Análisis de casos de ingeniería SDS",
        message=f"Analizando {total_groups} equipo(s)...",
        status="in_progress",
    )

    def _run():
        try:
            service.analyze_cases(
                scope=body.scope,
                pairs=pairs,
                force=body.force,
                include_logs=body.include_logs,
                include_cds=body.include_cds,
                job_id=job_id,
                notification_id=notification.id,
            )
        except Exception as exc:
            _logger.exception("Fallo el job de análisis de casos de ingeniería %s", job_id)
            from backend.application.services.job_tracker import update_job

            update_job(job_id, 0, total_groups, status="failed")
            try:
                notification_repo.update_status(
                    notification.id,
                    status="error",
                    title="Análisis de casos de ingeniería falló",
                    message=str(exc)[:500],
                )
            except Exception:
                pass

    threading.Thread(target=_run, daemon=True).start()

    return EngineeringAnalyzeJobResponse(
        job_id=job_id, total=total_groups, status="running", notification_id=str(notification.id)
    )


@router.get(
    "/jobs/{job_id}",
    dependencies=[Depends(authenticate)],
    summary="Progreso de un job de análisis de casos de ingeniería",
)
def get_engineering_job(job_id: str) -> Dict[str, Any]:
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get(
    "/stats",
    response_model=list[EngineeringCodeStat],
    dependencies=[Depends(authenticate)],
    summary="Estadísticas por código de triage (histórico local)",
)
async def get_engineering_stats(
    request: Request,
    repo: SdsEngineeringRepository = Depends(get_sds_engineering_repo),
) -> list[EngineeringCodeStat]:
    stats = await asyncio.to_thread(repo.code_stats)
    return [EngineeringCodeStat(**s) for s in stats]
