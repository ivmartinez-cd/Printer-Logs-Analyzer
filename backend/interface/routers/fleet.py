"""Fleet monitor endpoints — list clients and batch-scan device logs."""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from backend.application.parsers.log_parser import LogParser
from backend.application.services.insight_service import (
    extract_roller_components,
    get_devices_by_customer,
    normalize_device_metadata,
    search_customers,
)
from backend.application.services.insight_service import (
    get_device_alerts as _insight_get_device_alerts,
)
from backend.application.services.insight_service import (
    get_device_info as _insight_get_device_info,
)
from backend.application.services.sds_web_service import (
    extract_help_urls,
    get_session as get_sds_session,
    html_to_tsv,
)
from backend.infrastructure.repositories.error_code_repository import ErrorCodeRepository
from backend.infrastructure.config import Settings
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
from fastapi import APIRouter, Depends, HTTPException

router = APIRouter(prefix="/fleet", tags=["Fleet Monitor"])
_logger = logging.getLogger(__name__)
_fleet_repo = FleetRepository()
_parser = LogParser()

_SCAN_CONCURRENCY = 3

# Model substring → roller extendedFields keys for fallback when Insight returns no data
_MODEL_ROLLER_FIELDS: list[tuple[str, list[str]]] = [
    (
        "E62655",
        ["pickupRollerTray1Life", "pickupRollerTray2Life", "adfPickupRollerLife", "separationRollerLife"],
    ),
    (
        "E60175",
        ["maintenanceKitPercent"],
    ),
]
_DEFAULT_ROLLER_FIELDS = ["maintenanceKitPercent"]


def _mock_roller_fields(model: str | None, serial: str) -> dict[str, Any]:
    """Return deterministic roller field values when Insight returns no extendedFields."""
    import hashlib

    seed = int(hashlib.md5(serial.encode()).hexdigest(), 16)

    def _pct(offset: int) -> float:
        return float(30 + (seed + offset) % 60)  # 30–89 %

    fields_keys = _DEFAULT_ROLLER_FIELDS
    if model:
        for substr, keys in _MODEL_ROLLER_FIELDS:
            if substr in model:
                fields_keys = keys
                break

    return {key: _pct(i) for i, key in enumerate(fields_keys)}


def _telemetry_payload(serial: str, metadata: dict[str, Any] | None) -> dict[str, Any]:
    normalized = normalize_device_metadata(serial, metadata)
    return {
        "fuser_life_percent": float(normalized["fuser_life"]),
        "black_toner_percent": float(normalized["toner_life"]),
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
        v for k, v in telemetry.items()
        if k in ("fuser_life_percent", "black_toner_percent") and v is not None
    ]
    consumable_values += [r["percent"] for r in roller_components]

    min_consumable = min(consumable_values) if consumable_values else 100.0

    if max_level == 2 or min_consumable < 15.0:
        status = "critical"
    elif max_level == 1 or min_consumable < 30.0:
        status = "warning"
    else:
        status = "ok"

    return status, len(active_alerts), max_severity


@router.get("/clients", response_model=list[ClientSummary], dependencies=[Depends(authenticate)])
async def list_clients() -> list[ClientSummary]:
    return [ClientSummary(**client) for client in _fleet_repo.list_clients()]


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
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    devices: list[DeviceEntry] = client["devices"]

    if client.get("is_dynamic"):
        try:
            customers = search_customers(
                settings.insight_portal_url or "",
                settings.insight_api_key or "",
                settings.insight_api_secret or "",
                client["name"],
            )
            if customers:
                customer_id = customers[0]["customerId"]
                api_devices = get_devices_by_customer(
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
            _logger.warning(
                "Dynamic discovery failed for %s: %s. Falling back to seed.",
                client_id,
                exc,
            )

    return ClientDetail(
        id=client["id"],
        name=client["name"],
        devices=[DeviceSummary(**device) for device in devices],
    )


@router.post(
    "/scan",
    response_model=list[DeviceScanResult],
    dependencies=[Depends(authenticate)],
    summary="Batch-scan all devices for a client via SDS",
)
async def scan_fleet(
    body: ScanRequest,
    settings: Settings = Depends(get_settings),
    error_code_repo: ErrorCodeRepository = Depends(get_error_code_repo),
) -> list[DeviceScanResult]:
    if not (settings.sds_web_username and settings.sds_web_password):
        raise HTTPException(status_code=503, detail="Integración SDS Web no configurada")
    if not (
        settings.insight_portal_url and settings.insight_api_key and settings.insight_api_secret
    ):
        raise HTTPException(status_code=503, detail="Integración Insight API no configurada")

    client = _fleet_repo.get_client(body.client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    devices: list[DeviceEntry] = client["devices"]

    if client.get("is_dynamic"):
        try:
            _logger.info("Starting dynamic discovery for %s", client["name"])
            customers = search_customers(
                settings.insight_portal_url or "",
                settings.insight_api_key or "",
                settings.insight_api_secret or "",
                client["name"],
            )
            if not customers:
                _logger.warning("No customer found in Insight for %s", client["name"])
            else:
                customer_id = customers[0]["customerId"]
                api_devices = get_devices_by_customer(
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
                    _logger.info("Discovered %d devices via Insight API", len(devices))
        except Exception as exc:
            _logger.error("Dynamic discovery failure for %s: %s", client["name"], exc)

    if body.models:
        devices = [device for device in devices if device.get("model") in body.models]

    if not devices:
        raise HTTPException(
            status_code=400,
            detail="No se encontraron dispositivos que coincidan con los modelos seleccionados",
        )

    semaphore = asyncio.Semaphore(_SCAN_CONCURRENCY)

    async def _scan_device(serial: str, location: str, model: str | None) -> DeviceScanResult:
        async with semaphore:
            return await asyncio.to_thread(_scan_device_sync, serial, location, model, error_code_repo)

    def _scan_device_sync(serial: str, location: str, model: str | None, error_code_repo: ErrorCodeRepository) -> DeviceScanResult:
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
            # Fall back to model-aware mock when Insight returns no roller fields
            if not roller_components:
                roller_components = extract_roller_components(_mock_roller_fields(model, normalized_serial))

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

            # Fetch current alerts for health calculation
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

            status, alert_count, max_severity = _compute_health(telemetry, roller_components, active_alerts)

            sds = get_sds_session(settings)
            raw_html = sds.fetch_event_logs_html(str(info["device_id"]), body.days)
            tsv_text = html_to_tsv(raw_html)

            # Sync catalog with fresh help URLs from this device logs
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

    tasks = [_scan_device(device["serial"], device["location"], device.get("model")) for device in devices]
    return await asyncio.gather(*tasks)
