"""Fleet monitor endpoints — list clients and batch-scan device logs."""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from backend.application.parsers.log_parser import LogParser
from backend.application.services.insight_service import (
    extract_roller_components,
    get_devices_by_customer,
    merge_consumables_into_metadata,
    normalize_device_metadata,
    search_customers,
)
from backend.application.services.insight_service import (
    get_device_alerts as _insight_get_device_alerts,
)
from backend.application.services.insight_service import (
    get_device_consumables as _insight_get_device_consumables,
)
from backend.application.services.insight_service import (
    get_device_info as _insight_get_device_info,
)
from backend.application.services.job_tracker import create_job, get_job, update_job
from backend.application.services.sds_web_service import (
    extract_help_urls,
    html_to_tsv,
)
from backend.application.services.sds_web_service import (
    get_session as get_sds_session,
)
from backend.infrastructure.config import Settings
from backend.infrastructure.repositories.error_code_repository import ErrorCodeRepository
from backend.infrastructure.repositories.fleet_repository import DeviceEntry, FleetRepository
from backend.interface.auth import authenticate
from backend.interface.deps import get_error_code_repo, get_settings
from backend.interface.schemas.fleet import (
    ClientDetail,
    ClientSummary,
    DeviceScanResult,
    DeviceSummary,
    ScanRequest,
)
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

router = APIRouter(prefix="/fleet", tags=["Fleet Monitor"])
_logger = logging.getLogger(__name__)
_fleet_repo = FleetRepository()
_parser = LogParser()

_SCAN_CONCURRENCY = 3

# Removed _MODEL_ROLLER_FIELDS and _DEFAULT_ROLLER_FIELDS (no fallback)


# Removed _mock_roller_fields


def _telemetry_payload(serial: str, metadata: dict[str, Any] | None) -> dict[str, Any]:
    if not metadata:
        return {
            "fuser_life_percent": None,
            "black_toner_percent": None,
        }
    normalized = normalize_device_metadata(serial, metadata)
    return {
        "fuser_life_percent": normalized.get("fuser_life"),
        "black_toner_percent": normalized.get("toner_life"),
    }


def _compute_health(
    telemetry: dict[str, Any],
    roller_components: list[dict[str, Any]],
    active_alerts: list[dict[str, Any]],
) -> tuple[str, int, str | None]:
    """Return (status, alert_count, max_alert_severity).

    Status logic (executive "Salud Actual"):
    - critical : any consumable/FRU < 15 % OR any active ERROR-level alert
    - warning  : any consumable/FRU between 15–30 % OR any active WARNING-level alert
    - ok       : everything healthy
    """
    levels = {"ERROR": 2, "WARNING": 1, "INFO": 0}
    max_level = 0
    for alert in active_alerts:
        sev = (alert.get("severity") or alert.get("type") or "INFO").upper()
        max_level = max(max_level, levels.get(sev, 0))

    max_severity: str | None = None
    if max_level == 2:
        max_severity = "ERROR"
    elif max_level == 1:
        max_severity = "WARNING"
    elif active_alerts:
        max_severity = "INFO"

    consumable_values: list[float] = [
        v
        for k, v in telemetry.items()
        if k in ("fuser_life_percent", "black_toner_percent") and v is not None
    ]
    consumable_values += [r["percent"] for r in roller_components]

    min_consumable = min(consumable_values) if consumable_values else 100.0

    if max_level == 2 or (consumable_values and min_consumable < 15.0):
        status = "critical"
    elif max_level == 1 or (consumable_values and min_consumable < 30.0):
        status = "warning"
    else:
        status = "ok"

    return status, len(active_alerts), max_severity


@router.get("/clients", response_model=list[ClientSummary], dependencies=[Depends(authenticate)])
async def list_clients(settings: Settings = Depends(get_settings)) -> list[ClientSummary]:
    clients_map = {}
    for c in _fleet_repo.list_clients():
        clients_map[c["name"].lower()] = ClientSummary(
            id=c["id"],
            name=c["name"],
            device_count=c["device_count"],
            is_dynamic=c["is_dynamic"]
        )

    if settings.insight_portal_url and "hp-sds-latam" in settings.insight_portal_url and settings.insight_api_key and settings.insight_api_key != "dev":
        try:
            live_customers = await asyncio.to_thread(
                search_customers,
                settings.insight_portal_url,
                settings.insight_api_key,
                settings.insight_api_secret,
                ""
            )
            for cust in live_customers:
                cust_name = cust.get("customerName")
                cust_id = str(cust.get("customerId"))
                if cust_name and cust_name.lower() not in clients_map:
                    clients_map[cust_name.lower()] = ClientSummary(
                        id=cust_id,
                        name=cust_name,
                        device_count=0,
                        is_dynamic=True
                    )
        except Exception as exc:
            _logger.warning("Failed to fetch live customers from EKM: %s", exc)

    return list(clients_map.values())


@router.get(
    "/clients/{client_id}",
    response_model=ClientDetail,
    dependencies=[Depends(authenticate)],
)
async def get_client(
    client_id: str,
    settings: Settings = Depends(get_settings),
) -> ClientDetail:
    client = _fleet_repo.get_client(client_id)
    devices: list[DeviceEntry] = []
    client_name = ""

    is_ekm_live = settings.insight_portal_url and "hp-sds-latam" in settings.insight_portal_url and settings.insight_api_key and settings.insight_api_key != "dev"

    if client:
        client_name = client["name"]
        devices = client["devices"]
        is_dynamic = client.get("is_dynamic", False)
    else:
        is_dynamic = True
        if client_id.isdigit() and is_ekm_live:
            try:
                customers = await asyncio.to_thread(
                    search_customers,
                    settings.insight_portal_url or "",
                    settings.insight_api_key or "",
                    settings.insight_api_secret or "",
                    ""
                )
                for cust in customers:
                    if str(cust.get("customerId")) == client_id:
                        client_name = cust.get("customerName") or f"Cliente {client_id}"
                        break
            except Exception as exc:
                _logger.warning("Failed to resolve customer name for ID %s: %s", client_id, exc)
            if not client_name:
                client_name = f"Cliente {client_id}"
        else:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")

    if is_dynamic and is_ekm_live:
        try:
            customer_id = None
            if client_id.isdigit():
                customer_id = int(client_id)
            else:
                customers = await asyncio.to_thread(
                    search_customers,
                    settings.insight_portal_url or "",
                    settings.insight_api_key or "",
                    settings.insight_api_secret or "",
                    client_name
                )
                if customers:
                    customer_id = customers[0]["customerId"]

            if customer_id is not None:
                api_devices = await asyncio.to_thread(
                    get_devices_by_customer,
                    settings.insight_portal_url or "",
                    settings.insight_api_key or "",
                    settings.insight_api_secret or "",
                    customer_id
                )
                if api_devices:
                    devices = [
                        {
                            "serial": device["serialNumber"],
                            "location": device.get("extendedFields", {}).get("zone")
                            or "Ubicación desconocida",
                            "model": device.get("extendedFields", {}).get("model"),
                        }
                        for device in api_devices
                    ]
        except Exception as exc:
            _logger.warning(
                "Dynamic discovery failed for %s: %s. Falling back to seed.",
                client_id,
                exc,
            )

    if not client_name and not devices:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    return ClientDetail(
        id=client_id,
        name=client_name,
        devices=[DeviceSummary(**device) for device in devices],
    )


@router.post(
    "/scan",
    response_model=list[DeviceScanResult],
    dependencies=[Depends(authenticate)],
    summary="Batch-scan all devices for a client via SDS (Synchronous)",
)
async def scan_fleet_sync(
    body: ScanRequest,
    settings: Settings = Depends(get_settings),
    error_code_repo: ErrorCodeRepository = Depends(get_error_code_repo),
) -> list[DeviceScanResult]:
    """Legacy synchronous scan."""
    return await _perform_scan(body, settings, error_code_repo)


@router.post(
    "/scan-now",
    dependencies=[Depends(authenticate)],
    summary="Start background batch-scan",
)
async def scan_fleet_async(
    body: ScanRequest,
    background_tasks: BackgroundTasks,
    settings: Settings = Depends(get_settings),
    error_code_repo: ErrorCodeRepository = Depends(get_error_code_repo),
):
    """Starts a background scan and returns a job_id."""
    client = _fleet_repo.get_client(body.client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    # Resolve devices first to know the total count
    devices = await _resolve_devices(client, body, settings)

    if not devices:
        raise HTTPException(
            status_code=400,
            detail="No se encontraron dispositivos. Verificá la configuración del cliente o los modelos seleccionados.",
        )

    job_id = create_job(len(devices))

    async def _run_scan():
        try:
            results = await _perform_scan(
                body, settings, error_code_repo, job_id=job_id, devices=devices
            )
            update_job(job_id, len(devices), 0, status="completed", results=results)
        except Exception as e:
            _logger.error(f"Background scan failed: {e}")
            update_job(job_id, 0, 0, status="failed")

    background_tasks.add_task(_run_scan)
    return {"job_id": job_id, "total": len(devices), "status": "running"}


@router.get("/scan-status/{job_id}", dependencies=[Depends(authenticate)])
async def get_scan_status(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


async def _resolve_devices(client: any, body: ScanRequest, settings: Settings) -> list[DeviceEntry]:
    devices: list[DeviceEntry] = client.get("devices", [])

    if client.get("is_dynamic"):
        try:
            from backend.application.services.insight_service import (
                get_devices_by_customer,
                search_customers,
            )

            customers = await asyncio.to_thread(
                search_customers,
                settings.insight_portal_url or "",
                settings.insight_api_key or "",
                settings.insight_api_secret or "",
                client["name"],
            )
            if customers:
                customer_id = customers[0]["customerId"]
                api_devices = await asyncio.to_thread(
                    get_devices_by_customer,
                    settings.insight_portal_url or "",
                    settings.insight_api_key or "",
                    settings.insight_api_secret or "",
                    customer_id,
                )
                if api_devices:
                    devices = [
                        {
                            "serial": device["serialNumber"],
                            "location": device.get("extendedFields", {}).get("zone")
                            or "Ubicación desconocida",
                            "model": device.get("extendedFields", {}).get("model"),
                        }
                        for device in api_devices
                    ]
        except Exception as exc:
            _logger.error("Dynamic discovery failure during resolution: %s", exc)

    if body.models:
        devices = [device for device in devices if device.get("model") in body.models]

    return devices


async def _perform_scan(
    body: ScanRequest,
    settings: Settings,
    error_code_repo: ErrorCodeRepository,
    job_id: str | None = None,
    devices: list[DeviceEntry] | None = None,
) -> list[DeviceScanResult]:
    if not (settings.sds_web_username and settings.sds_web_password):
        raise HTTPException(status_code=503, detail="Integración SDS Web no configurada")
    if not (
        settings.insight_portal_url and settings.insight_api_key and settings.insight_api_secret
    ):
        raise HTTPException(status_code=503, detail="Integración Insight API no configurada")

    if devices is None:
        client = _fleet_repo.get_client(body.client_id)
        if not client:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
        devices = await _resolve_devices(client, body, settings)

    if not devices:
        return []

    semaphore = asyncio.Semaphore(_SCAN_CONCURRENCY)
    processed = 0
    errors = 0
    results = []

    lock = asyncio.Lock()

    async def _scan_device_task(serial: str, location: str, model: str | None) -> DeviceScanResult:
        nonlocal processed, errors
        async with semaphore:
            res = await asyncio.to_thread(
                _scan_device_sync, serial, location, model, settings, error_code_repo, body.days
            )
            async with lock:
                processed += 1
                if res.status == "unreachable" and res.error_message:
                    errors += 1
                if job_id:
                    update_job(job_id, processed, errors)
                results.append(res)
            return res

    tasks = [
        _scan_device_task(device["serial"], device["location"], device.get("model"))
        for device in devices
    ]
    await asyncio.gather(*tasks)
    return results


def _scan_device_sync(
    serial: str,
    location: str,
    model: str | None,
    settings: Settings,
    error_code_repo: ErrorCodeRepository,
    days: int,
) -> DeviceScanResult:
    normalized_serial = serial.strip().upper()
    info: dict[str, Any] | None = None
    telemetry = _telemetry_payload(normalized_serial, None)

    try:
        info = _insight_get_device_info(
            settings.insight_portal_url,
            settings.insight_api_key,
            settings.insight_api_secret,
            normalized_serial,
        )
        raw_extended = info.get("raw_extended") or {}
        telemetry = _telemetry_payload(normalized_serial, info.get("metadata"))
        roller_components = extract_roller_components(raw_extended)

        try:
            real_consumables = _insight_get_device_consumables(
                settings.insight_portal_url,
                settings.insight_api_key,
                settings.insight_api_secret,
                info["device_id"],
            )
            if real_consumables:
                updated_metadata = merge_consumables_into_metadata(
                    info.get("metadata") or {}, real_consumables
                )
                telemetry = _telemetry_payload(normalized_serial, updated_metadata)
                real_rollers = extract_roller_components(
                    {
                        item.get("description") or item.get("type"): item.get("percentLeft")
                        for item in real_consumables
                    }
                )
                if real_rollers:
                    roller_components = real_rollers
        except Exception as exc:
            _logger.warning(
                "Could not fetch real-time consumables for %s: %s", normalized_serial, exc
            )

        if not info.get("device_id"):
            return DeviceScanResult(
                serial=normalized_serial,
                location=location,
                status="unreachable",
                error_count=0,
                warning_count=0,
                model_name=info.get("model_name"),
                firmware=info.get("firmware"),
                last_event_date=None,
                error_message="Dispositivo no encontrado en Insight",
                **telemetry,
            )

        active_alerts: list[dict[str, Any]] = []
        try:
            alerts_data = _insight_get_device_alerts(
                settings.insight_portal_url,
                settings.insight_api_key,
                settings.insight_api_secret,
                normalized_serial,
            )
            active_alerts = alerts_data.get("current", [])
        except Exception as exc:
            _logger.warning("Could not fetch alerts for %s: %s", normalized_serial, exc)

        status, alert_count, max_severity = _compute_health(
            telemetry, roller_components, active_alerts
        )

        sds = get_sds_session(settings)
        raw_html = sds.fetch_event_logs_html(str(info["device_id"]), days)
        tsv_text = html_to_tsv(raw_html)

        help_data = extract_help_urls(raw_html)
        for code, data in help_data.items():
            try:
                error_code_repo.upsert(
                    code=code, solution_url=data["url"], description=data.get("description")
                )
            except Exception as exc:
                _logger.warning("Failed to update catalog for %s during fleet scan: %s", code, exc)

        report = _parser.parse_text(tsv_text) if tsv_text.strip() else None
        events = report.events if report else []
        error_count = sum(1 for event in events if event.type == "ERROR")
        warning_count = sum(1 for event in events if event.type == "WARNING")

        top_errors = []
        if events:
            error_groups: dict[str, int] = {}
            for evt in events:
                if evt.type == "ERROR":
                    error_groups[evt.code] = error_groups.get(evt.code, 0) + 1

            sorted_errors = sorted(error_groups.items(), key=lambda x: x[1], reverse=True)
            top_errors = [{"code": code, "count": count} for code, count in sorted_errors[:3]]

        timeline_map = {}
        for event in events:
            d_str = event.timestamp.date().isoformat()
            if d_str not in timeline_map:
                timeline_map[d_str] = {"date": d_str, "errors": 0, "warnings": 0}
            if event.type == "ERROR":
                timeline_map[d_str]["errors"] += 1
            elif event.type == "WARNING":
                timeline_map[d_str]["warnings"] += 1

        timeline_data = sorted(timeline_map.values(), key=lambda x: x["date"])

        last_date: str | None = None
        if events:
            latest_timestamp = max(event.timestamp for event in events)
            last_date = latest_timestamp.isoformat()

        return DeviceScanResult(
            serial=normalized_serial,
            location=location,
            status=status,
            error_count=error_count,
            warning_count=warning_count,
            model_name=info.get("model_name"),
            firmware=info.get("firmware"),
            last_event_date=last_date,
            active_alerts_count=alert_count,
            active_alerts_max_severity=max_severity,
            roller_components=roller_components,
            top_errors=top_errors,
            timeline_data=timeline_data,
            **telemetry,
        )
    except Exception as exc:
        _logger.warning("Scan failed for %s: %s", normalized_serial, exc)
        return DeviceScanResult(
            serial=normalized_serial,
            location=location,
            status="unreachable",
            error_count=0,
            warning_count=0,
            model_name=info.get("model_name") if info else None,
            firmware=info.get("firmware") if info else None,
            last_event_date=None,
            error_message=str(exc),
            **telemetry,
        )
