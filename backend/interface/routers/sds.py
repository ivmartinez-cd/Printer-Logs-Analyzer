import asyncio
import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from backend.interface.schemas.sds import (
    ExtractSdsLogsRequest, 
    ExtractSdsLogsResponse, 
    ResolveDeviceResponse
)
from backend.interface.deps import (
    get_printer_model_repo, 
    get_error_solution_repo,
    get_settings
)
from backend.interface.auth import authenticate
from backend.infrastructure.repositories.printer_model_repository import PrinterModelRepository
from backend.infrastructure.repositories.error_solution_repository import ErrorSolutionRepository
from backend.infrastructure.config import Settings
from backend.application.services.insight_service import (
    get_device_alerts as _insight_get_device_alerts,
    get_device_info as _insight_get_device_info,
    get_device_consumables as _insight_get_device_consumables,
    get_device_meters as _insight_get_device_meters,
    InsightAPIError,
)
from backend.interface.rate_limiter import limiter
from backend.application.services.sds_web_service import (
    get_session as get_sds_session,
    SDSWebError,
    html_to_tsv,
)
from typing import List, Dict, Any

router = APIRouter(tags=["SDS & Insight"])
_logger = logging.getLogger(__name__)

@router.get("/sds/resolve-device", response_model=ResolveDeviceResponse, dependencies=[Depends(authenticate)])
async def resolve_device_endpoint(
    request: Request,
    serial: str,
    settings: Settings = Depends(get_settings),
    printer_model_repository: PrinterModelRepository = Depends(get_printer_model_repo),
    error_solution_repository: ErrorSolutionRepository = Depends(get_error_solution_repo)
) -> ResolveDeviceResponse:
    if not (settings.insight_portal_url and settings.insight_api_key and settings.insight_api_secret):
        raise HTTPException(status_code=503, detail="Integración Insight API no configurada")

    serial = serial.strip().upper()
    if not serial:
        raise HTTPException(status_code=400, detail="Número de serie es requerido")

    info = await asyncio.to_thread(
        _insight_get_device_info,
        settings.insight_portal_url,
        settings.insight_api_key,
        settings.insight_api_secret,
        serial,
    )
    if not info["device_id"]:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado en el Portal")
    
    model_match = await asyncio.to_thread(
        printer_model_repository.find_best_match, 
        info["model_name"] or "Unknown"
    )
    
    suggested_model_id = None
    suggested_model_name = None
    has_cpmd = False
    
    if model_match:
        suggested_model_id = model_match.id
        suggested_model_name = model_match.model_name
        cpmd_models = error_solution_repository.get_model_ids_with_solutions()
        has_cpmd = str(model_match.id) in cpmd_models

    return ResolveDeviceResponse(
        serial=serial,
        device_id=str(info["device_id"]),
        model_name_sds=info["model_name"] or "Unknown",
        firmware=info["firmware"],
        suggested_model_id=suggested_model_id,
        suggested_model_name=suggested_model_name,
        has_cpmd=has_cpmd
    )

@router.post("/sds/extract-logs", response_model=ExtractSdsLogsResponse, dependencies=[Depends(authenticate)])
async def extract_sds_logs(
    request: Request,
    body: ExtractSdsLogsRequest,
    settings: Settings = Depends(get_settings),
    printer_model_repository: PrinterModelRepository = Depends(get_printer_model_repo),
    error_solution_repository: ErrorSolutionRepository = Depends(get_error_solution_repo)
) -> ExtractSdsLogsResponse:
    if not (settings.sds_web_username and settings.sds_web_password):
        raise HTTPException(status_code=503, detail="Integración SDS Web no configurada")
    if not (settings.insight_portal_url and settings.insight_api_key and settings.insight_api_secret):
        raise HTTPException(status_code=503, detail="Integración Insight API no configurada")

    serial = body.serial.strip().upper()
    if not serial:
        raise HTTPException(status_code=400, detail="Número de serie inválido")

    def _do_extract():
        info = _insight_get_device_info(
            settings.insight_portal_url,
            settings.insight_api_key,
            settings.insight_api_secret,
            serial,
        )
        if not info["device_id"]:
            raise HTTPException(status_code=404, detail="Dispositivo no encontrado.")

        sds = get_sds_session(settings)
        device_id = str(info["device_id"])
        raw_html = sds.fetch_event_logs_html(device_id, body.days)
        tsv_text = html_to_tsv(raw_html)
        
        model_match = printer_model_repository.find_best_match(info["model_name"] or "Unknown")
        suggested_model_id = model_match.id if model_match else None
        has_cpmd = False
        if suggested_model_id:
            cpmd_models = error_solution_repository.get_model_ids_with_solutions()
            has_cpmd = str(suggested_model_id) in cpmd_models

        realtime_consumables = _insight_get_device_consumables(
            settings.insight_portal_url,
            settings.insight_api_key,
            settings.insight_api_secret,
            info["device_id"],
        )

        return ExtractSdsLogsResponse(
            serial=serial,
            device_id=device_id,
            model_name_sds=info["model_name"] or "Unknown",
            firmware=info["firmware"],
            suggested_model_id=suggested_model_id,
            has_cpmd=has_cpmd,
            logs_text=tsv_text,
            event_count=len(tsv_text.strip().splitlines()) - 1 if tsv_text else 0,
            realtime_consumables=realtime_consumables
        )

    return await asyncio.wait_for(asyncio.to_thread(_do_extract), timeout=25.0)

@router.get("/insight/devices/{serial}/alerts", dependencies=[Depends(authenticate)])
@limiter.limit("30/minute")
async def insight_device_alerts(
    request: Request,
    serial: str,
    settings: Settings = Depends(get_settings),
) -> Dict[str, Any]:
    if not (settings.insight_portal_url and settings.insight_api_key and settings.insight_api_secret):
        return {"insight_configured": False}

    serial = serial.strip().upper()
    return await asyncio.to_thread(
        _insight_get_device_alerts,
        settings.insight_portal_url,
        settings.insight_api_key,
        settings.insight_api_secret,
        serial,
    )

@router.get("/insight/devices/{serial}/meters", dependencies=[Depends(authenticate)])
@limiter.limit("20/minute")
async def get_insight_meters(
    request: Request, 
    serial: str,
    settings: Settings = Depends(get_settings)
) -> List[Dict[str, Any]]:
    info = await asyncio.to_thread(
        _insight_get_device_info,
        settings.insight_portal_url,
        settings.insight_api_key,
        settings.insight_api_secret,
        serial,
    )
    if not info["device_id"]:
        return []
    
    return await asyncio.to_thread(
        _insight_get_device_meters,
        settings.insight_portal_url,
        settings.insight_api_key,
        settings.insight_api_secret,
        info["device_id"],
    )
