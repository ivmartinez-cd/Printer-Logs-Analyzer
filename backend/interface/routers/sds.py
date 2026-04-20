import asyncio
import logging
from typing import Any, Dict, List

from backend.application.services.insight_service import (
    get_device_alerts as _insight_get_device_alerts,
)
from backend.application.services.insight_service import (
    get_device_consumables as _insight_get_device_consumables,
)
from backend.application.services.insight_service import (
    get_device_info as _insight_get_device_info,
)
from backend.application.services.insight_service import (
    get_device_meters as _insight_get_device_meters,
)
from backend.application.services.sds_web_service import (
    extract_help_urls,
    html_to_tsv,
)
from backend.application.services.sds_web_service import (
    get_session as get_sds_session,
)
from backend.infrastructure.config import Settings
from backend.infrastructure.repositories.error_code_repository import ErrorCodeRepository
from backend.infrastructure.repositories.error_solution_repository import ErrorSolutionRepository
from backend.interface.auth import authenticate
from backend.interface.deps import get_error_code_repo, get_error_solution_repo, get_settings
from backend.interface.rate_limiter import limiter
from backend.interface.schemas.sds import (
    ExtractSdsLogsRequest,
    ExtractSdsLogsResponse,
    ResolveDeviceResponse,
)
from fastapi import APIRouter, Depends, HTTPException, Request

router = APIRouter(tags=["SDS & Insight"])
_logger = logging.getLogger(__name__)


@router.get(
    "/sds/resolve-device",
    response_model=ResolveDeviceResponse,
    dependencies=[Depends(authenticate)],
    summary="Resolve device information from serial number",
    response_description="Device ID, SDS model name, and suggested catalog model.",
)
async def resolve_device_endpoint(
    request: Request,
    serial: str,
    settings: Settings = Depends(get_settings),
    error_solution_repository: ErrorSolutionRepository = Depends(get_error_solution_repo),
) -> ResolveDeviceResponse:
    if not (
        settings.insight_portal_url and settings.insight_api_key and settings.insight_api_secret
    ):
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

    return ResolveDeviceResponse(
        serial=serial,
        device_id=str(info["device_id"]),
        model_name_sds=info["model_name"] or "Unknown",
        firmware=info["firmware"],
        suggested_model_id=None,
        suggested_model_name=info["model_name"] or "Unknown",
    )


@router.post(
    "/sds/extract-logs",
    response_model=ExtractSdsLogsResponse,
    dependencies=[Depends(authenticate)],
    summary="Extract event logs from SDS Web portal",
    response_description="A TSW-formatted string of logs and device telemetry.",
)
async def extract_sds_logs(
    request: Request,
    body: ExtractSdsLogsRequest,
    settings: Settings = Depends(get_settings),
    error_solution_repository: ErrorSolutionRepository = Depends(get_error_solution_repo),
    error_code_repo: ErrorCodeRepository = Depends(get_error_code_repo),
) -> ExtractSdsLogsResponse:
    if not (settings.sds_web_username and settings.sds_web_password):
        raise HTTPException(status_code=503, detail="Integración SDS Web no configurada")
    if not (
        settings.insight_portal_url and settings.insight_api_key and settings.insight_api_secret
    ):
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

        # Update error code catalog with fresh Content Bootstrapper URLs and descriptions from this fetch
        help_data = extract_help_urls(raw_html)
        for code, data in help_data.items():
            try:
                error_code_repo.upsert(
                    code=code, solution_url=data["url"], description=data.get("description")
                )
            except Exception as exc:
                _logger.warning("Failed to update catalog for %s: %s", code, exc)

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
            suggested_model_id=None,
            logs_text=tsv_text,
            event_count=len(tsv_text.strip().splitlines()) - 1 if tsv_text else 0,
            realtime_consumables=realtime_consumables,
        )

    return await asyncio.wait_for(asyncio.to_thread(_do_extract), timeout=25.0)


@router.get(
    "/insight/devices/{serial}/alerts",
    dependencies=[Depends(authenticate)],
    summary="Get active alerts from Insight API",
    response_description="A list of active device alerts/warnings.",
)
@limiter.limit("30/minute")
async def insight_device_alerts(
    request: Request,
    serial: str,
    settings: Settings = Depends(get_settings),
) -> Dict[str, Any]:
    if not (
        settings.insight_portal_url and settings.insight_api_key and settings.insight_api_secret
    ):
        return {"insight_configured": False}

    serial = serial.strip().upper()
    return await asyncio.to_thread(
        _insight_get_device_alerts,
        settings.insight_portal_url,
        settings.insight_api_key,
        settings.insight_api_secret,
        serial,
    )


@router.get(
    "/insight/devices/{serial}/meters",
    dependencies=[Depends(authenticate)],
    summary="Get device meters/counters",
    response_description="A list of device counters (Total, Color, etc.).",
)
@limiter.limit("20/minute")
async def get_insight_meters(
    request: Request, serial: str, settings: Settings = Depends(get_settings)
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
