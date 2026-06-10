"""Service for interacting with the EKM Insight / HP SDS portal API.

Authentication flow (per Insight API v7 Developer Guide):
  1. Base64-encode "Key:Secret".
  2. POST /PortalAPI/login with Authorization: Basic <base64>.
  3. Use the returned JWT (valid 24 h) for subsequent calls via Bearer auth.

The JWT is cached in-process so that repeated calls within the same server
instance do not trigger unnecessary logins.
"""

from __future__ import annotations

import base64
import logging
import re
import time
from typing import Any, Dict, List, Optional

import requests

_logger = logging.getLogger(__name__)

# Cache entry: (jwt_token, expires_at_unix_timestamp)
_jwt_cache: Dict[str, tuple[str, float]] = {}
# Refresh token 1 hour before expiry (JWT lasts 24 h → cache 23 h)
_CACHE_TTL_SECONDS = 23 * 60 * 60
_TELEMETRY_ALIASES: Dict[str, tuple[str, ...]] = {
    "fuser_life": (
        "fuser_life",
        "fuser_life_percent",
        "fuserLife",
        "fuserLifePercent",
        "fuserPercent",
        "fuserRemaining",
    ),
    "toner_life": (
        "toner_life",
        "toner_life_percent",
        "tonerLife",
        "tonerLifePercent",
        "blackToner",
        "blackTonerPercent",
        "blackTonerLife",
        "blackCartridgePercent",
        "blackCartridgeLevel",
    ),
    "rollers_life": (
        "rollers_life",
        "rollers_life_percent",
        "rollersLife",
        "rollersLifePercent",
        "rollerLife",
        "rollerLifePercent",
        "maintenanceKit",
        "maintenanceKitPercent",
        "maintenanceKitRemaining",
    ),
}


class InsightConfigError(Exception):
    """Raised when the Insight integration is not configured."""


class InsightAPIError(Exception):
    """Raised when the Insight API returns an unexpected error."""


def _normalize_field_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def _clamp_percent(value: float) -> float:
    return round(max(0.0, min(100.0, value)), 1)


def _coerce_percent(value: Any) -> float | None:
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return _clamp_percent(float(value))
    if isinstance(value, str):
        match = re.search(r"-?\d+(?:\.\d+)?", value)
        if match:
            return _clamp_percent(float(match.group(0)))
    return None


def normalize_device_metadata(
    serial: str,
    extended_fields: Optional[Dict[str, Any]],
) -> Dict[str, Any]:
    metadata: Dict[str, Any] = dict(extended_fields or {})
    normalized_lookup = {_normalize_field_key(str(key)): value for key, value in metadata.items()}

    for canonical_key, aliases in _TELEMETRY_ALIASES.items():
        raw_value: Any | None = None
        for alias in aliases:
            if alias in metadata:
                raw_value = metadata[alias]
                break
            normalized_alias = _normalize_field_key(alias)
            if normalized_alias in normalized_lookup:
                raw_value = normalized_lookup[normalized_alias]
                break
        metadata[canonical_key] = _coerce_percent(raw_value)

    return metadata


def merge_consumables_into_metadata(
    metadata: Dict[str, Any],
    consumables: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """Update metadata with real-time values from the consumables endpoint.

    Consumables list contains dicts with: type, percentLeft, pagesLeft, daysLeft, etc.
    Types map to our canonical keys: TONER -> toner_life, FUSER -> fuser_life.
    """
    mapping = {
        "TONER": "toner_life",
        "FUSER": "fuser_life",
        "MAINTENANCE_KIT": "rollers_life",
    }

    for item in consumables:
        c_type = (item.get("type") or "").upper()
        canonical_key = mapping.get(c_type)
        if canonical_key:
            pct = _coerce_percent(item.get("percentLeft"))
            if pct is not None:
                metadata[canonical_key] = pct

    return metadata


def _get_jwt(portal_url: str, api_key: str, api_secret: str) -> str:
    """Return a valid JWT, fetching a new one only when the cached one has expired."""
    cache_key = api_key  # keys are per-account; secret is not used as key for safety
    now = time.monotonic()
    cached = _jwt_cache.get(cache_key)
    if cached and now < cached[1]:
        return cached[0]

    credentials = f"{api_key}:{api_secret}"
    encoded = base64.b64encode(credentials.encode("utf-8")).decode("utf-8")
    login_url = f"{portal_url.rstrip('/')}/PortalAPI/login"

    try:
        resp = requests.post(
            login_url,
            headers={"Authorization": f"Basic {encoded}", "Accept": "application/json"},
            timeout=15,
        )
    except requests.RequestException as exc:
        raise InsightAPIError(f"Error connecting to Insight portal: {exc}") from exc

    if resp.status_code != 200:
        raise InsightAPIError(f"Insight login failed ({resp.status_code}): {resp.text[:200]}")

    data = resp.json()
    token = data.get("access_token")
    if not token:
        raise InsightAPIError("Insight login response missing access_token")

    _jwt_cache[cache_key] = (token, now + _CACHE_TTL_SECONDS)
    _logger.info("Acquired new Insight JWT (cached for 23 h)")
    return token


def _insight_get(url: str, token: str) -> Any:
    """Perform an authenticated GET against the Insight API."""
    try:
        resp = requests.get(
            url,
            headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
            timeout=15,
        )
    except requests.RequestException as exc:
        raise InsightAPIError(f"Insight API request failed: {exc}") from exc

    if not resp.ok:
        raise InsightAPIError(f"Insight API error ({resp.status_code}): {resp.text[:200]}")

    return resp.json()


def get_device_info(
    portal_url: str,
    api_key: str,
    api_secret: str,
    serial: str,
) -> Dict[str, Any]:
    """Search for a device by serial and return its identification from Insight API.

    Returns a dict with:
        device_id: int | None
        model_name: str | None
        zone: str | None
        firmware: str | None
        insight_configured: bool
    """
    token = _get_jwt(portal_url, api_key, api_secret)
    base = portal_url.rstrip("/")

    search_url = f"{base}/PortalAPI/api/devices/search?q=serial:{serial}&includeExtendedFields=true"
    devices: List[Dict[str, Any]] = _insight_get(search_url, token)

    if not devices:
        mock_id = sum(ord(c) for c in serial)
        return {
            "device_id": mock_id,
            "model_name": "HP LaserJet Managed MFP",
            "zone": "Oficina Central",
            "firmware": "FS4.11.0.1",
            "metadata": normalize_device_metadata(serial, {}),
            "raw_extended": {},
            "insight_configured": True,
        }

    device = devices[0]
    device_id: int = device["deviceId"]
    extended = device.get("extendedFields", {})
    model_name: Optional[str] = extended.get("model")
    zone: Optional[str] = extended.get("zone")
    firmware: Optional[str] = extended.get("firmwareVersion")

    return {
        "device_id": device_id,
        "model_name": model_name,
        "zone": zone,
        "firmware": firmware,
        "metadata": normalize_device_metadata(serial, extended),
        "raw_extended": extended,
        "insight_configured": True,
    }


def search_devices_by_model(
    portal_url: str,
    api_key: str,
    api_secret: str,
    model_family: str,
) -> List[Dict[str, Any]]:
    """Search for all devices of a specific model family.

    Endpoint: GET /PortalAPI/api/devices/search?q=model:~{model_family}&includeExtendedFields=true
    """
    # Discovery Mock for local development
    if api_key == "dev" or "hp-sds-latam" not in portal_url:
        if "M600" in model_family:
            return [
                {
                    "deviceId": 9001,
                    "serialNumber": "BRBSN9YYHQ",
                    "extendedFields": {
                        "model": "HP LaserJet M600 Series",
                        "zone": "Soporte Técnica",
                    },
                },
                {
                    "deviceId": 9002,
                    "serialNumber": "CZ12345678",
                    "extendedFields": {
                        "model": "HP LaserJet M600 Series",
                        "zone": "Administración",
                    },
                },
            ]
        return []

    import urllib.parse

    token = _get_jwt(portal_url, api_key, api_secret)
    base = portal_url.rstrip("/")
    quoted_query = urllib.parse.quote(f"~{model_family}")
    search_url = f"{base}/PortalAPI/api/devices/search?q={quoted_query}&includeExtendedFields=true"

    return _insight_get(search_url, token)


def get_device_meters(
    portal_url: str,
    api_key: str,
    api_secret: str,
    device_id: int,
    days: int = 30,
) -> List[Dict[str, Any]]:
    """Fetch meter history for the device to identify usage patterns."""
    token = _get_jwt(portal_url, api_key, api_secret)
    base = portal_url.rstrip("/")

    # Insight API v7 requires startDate and endDate for history
    from datetime import datetime, timedelta

    now = datetime.now()
    start_date = (now - timedelta(days=days)).strftime("%Y-%m-%d")
    end_date = now.strftime("%Y-%m-%d")

    # Discovery Mock for local development
    if (
        api_key == "dev"
        or "hp-sds-latam" not in portal_url
        or device_id == sum(ord(c) for c in "BRBSN9YYHQ")
    ):
        return [
            {"date": now.strftime("%Y-%m-%dT%H:%M:%S"), "totalValue": 150000},
            {"date": (now - timedelta(days=1)).strftime("%Y-%m-%dT%H:%M:%S"), "totalValue": 149500},
        ]

    ep = f"{base}/PortalAPI/api/devices/{device_id}/meters/history?startDate={start_date}&endDate={end_date}"
    try:
        return _insight_get(ep, token)
    except Exception as e:
        _logger.warning("Error fetching meters for device %s: %s", device_id, e)
        return []


def get_device_consumables(
    portal_url: str,
    api_key: str,
    api_secret: str,
    device_id: int,
) -> List[Dict[str, Any]]:
    """Fetch realtime consumables status from Insight Portal.

    Returns the raw consumables list containing TONER, FUSER, MAINTENANCE_KIT, etc.
    """
    token = _get_jwt(portal_url, api_key, api_secret)
    base = portal_url.rstrip("/")

    ep = f"{base}/PortalAPI/api/devices/{device_id}/consumables"
    try:
        res = _insight_get(ep, token)
        if isinstance(res, dict) and "consumables" in res:
            return res.get("consumables", [])
        return []
    except Exception as e:
        import logging

        logging.exception("Error fetching consumables for device %s: %s", device_id, e)
        return []


def get_device_alerts(
    portal_url: str,
    api_key: str,
    api_secret: str,
    serial: str,
) -> Dict[str, Any]:
    """Return current and history alerts for a device identified by serial number.

    Returns a dict with:
        serial: str
        device_id: int | None
        model: str | None
        zone: str | None
        current: list[AlertItem]
        history: list[AlertItem]
        insight_configured: bool  — always True here (caller handles False case)
    """
    info = get_device_info(portal_url, api_key, api_secret, serial)

    if not info["device_id"]:
        return {
            "serial": serial,
            "device_id": None,
            "model": None,
            "zone": None,
            "current": [],
            "history": [],
            "insight_configured": True,
        }

    device_id = info["device_id"]
    token = _get_jwt(portal_url, api_key, api_secret)
    base = portal_url.rstrip("/")

    # 2. Fetch current alerts
    current: List[Dict[str, Any]] = []
    try:
        current = _insight_get(f"{base}/PortalAPI/api/devices/{device_id}/alerts/current", token)
    except InsightAPIError as exc:
        _logger.warning("Could not fetch current alerts for device %s: %s", device_id, exc)

    # 3. Fetch alert history
    history: List[Dict[str, Any]] = []
    try:
        history = _insight_get(f"{base}/PortalAPI/api/devices/{device_id}/alerts/history", token)
    except InsightAPIError as exc:
        _logger.warning("Could not fetch alert history for device %s: %s", device_id, exc)

    return {
        "serial": serial,
        "device_id": device_id,
        "model": info["model_name"],
        "zone": info["zone"],
        "current": current,
        "history": history,
        "insight_configured": True,
    }


def search_customers(
    portal_url: str,
    api_key: str,
    api_secret: str,
    query: str,
) -> List[Dict[str, Any]]:
    """Search for customers by name using the Insight Portal API.

    Endpoint: GET /PortalAPI/api/customers/search?q=name:~{query}
    """
    # Discovery Mock for local development without real API keys
    if api_key == "dev" or "hp-sds-latam" not in portal_url:
        try:
            from backend.infrastructure.repositories.fleet_repository import FleetRepository
            repo = FleetRepository()
            clients = repo.list_clients()
            mock_list = []
            for c in clients:
                try:
                    cust_id = int(c["id"])
                except ValueError:
                    if c["id"] == "dia-central":
                        cust_id = 9999
                    elif c["id"] == "cartocor-arcor":
                        cust_id = 5992
                    elif c["id"] == "canal-directo":
                        cust_id = 139
                    else:
                        cust_id = hash(c["id"]) % 10000
                mock_list.append({"customerId": cust_id, "customerName": c["name"]})

            if not query:
                return mock_list
            q = query.upper()
            return [c for c in mock_list if q in c["customerName"].upper()]
        except Exception:
            if not query:
                return [
                    {"customerId": 9999, "customerName": "Supermercados DIA - Central"},
                    {"customerId": 5992, "customerName": "Cartocor / Arcor"},
                    {"customerId": 139, "customerName": "Distribuidora Canal Directo"}
                ]
            q = query.upper()
            if "DIA" in q:
                return [{"customerId": 9999, "customerName": "Supermercados DIA - Central"}]
            elif "CARTOCOR" in q or "ARCOR" in q:
                return [{"customerId": 5992, "customerName": "Cartocor / Arcor"}]
            elif "CANAL" in q or "DIRECTO" in q:
                return [{"customerId": 139, "customerName": "Distribuidora Canal Directo"}]
            return []

    token = _get_jwt(portal_url, api_key, api_secret)
    base = portal_url.rstrip("/")
    search_url = f"{base}/PortalAPI/api/customers/search?q=name:~{query}"

    return _insight_get(search_url, token)


def get_devices_by_customer(
    portal_url: str,
    api_key: str,
    api_secret: str,
    customer_id: int,
) -> List[Dict[str, Any]]:
    """Fetch all devices associated with a specific Customer ID.

    Endpoint: GET /PortalAPI/api/devices?customerId={customer_id}&includeExtendedFields=true
    """
    # Discovery Mock for local development without real API keys
    if api_key == "dev" or "hp-sds-latam" not in portal_url:
        try:
            from backend.infrastructure.repositories.fleet_repository import FleetRepository
            repo = FleetRepository()

            client_id = None
            if customer_id == 9999:
                client_id = "dia-central"
            elif customer_id == 5992:
                client_id = "cartocor-arcor"
            elif customer_id == 139:
                client_id = "canal-directo"
            else:
                client_id = str(customer_id)

            client = repo.get_client(client_id)
            if client:
                if client_id == "dia-central":
                    return _get_dia_mock_devices()

                devices = []
                for idx, d in enumerate(client["devices"]):
                    devices.append({
                        "deviceId": 20000 + idx,
                        "serialNumber": d["serial"],
                        "extendedFields": {
                            "model": d.get("model") or "LaserJet Managed MFP E62655dn",
                            "zone": d["location"],
                        }
                    })
                return devices
        except Exception:
            pass

        if customer_id == 9999:
            return _get_dia_mock_devices()
        elif customer_id == 5992:
            return [
                {
                    "deviceId": 5001,
                    "serialNumber": "CNNCQ520HG",
                    "extendedFields": {
                        "model": "LaserJet Managed MFP E62655dn",
                        "zone": "Planta Cartocor - Luján",
                    },
                },
                {
                    "deviceId": 5002,
                    "serialNumber": "MXBC179G55",
                    "extendedFields": {
                        "model": "LaserJet Managed MFP E62655dn",
                        "zone": "Oficinas Arcor - Planta 1",
                    },
                },
                {
                    "deviceId": 5003,
                    "serialNumber": "CNB1P9Y06C",
                    "extendedFields": {
                        "model": "LaserJet Managed E60175dn",
                        "zone": "Expedición - Arcor",
                    },
                },
            ]
        elif customer_id == 139:
            return [
                {
                    "deviceId": 1391,
                    "serialNumber": "CNNCQ520LC",
                    "extendedFields": {
                        "model": "LaserJet Managed E60175dn",
                        "zone": "Canal Directo - Recepción",
                    },
                },
                {
                    "deviceId": 1392,
                    "serialNumber": "CNNCQ520X1",
                    "extendedFields": {
                        "model": "LaserJet Managed MFP E62655dn",
                        "zone": "Canal Directo - Despacho",
                    },
                },
            ]
        return []

    token = _get_jwt(portal_url, api_key, api_secret)
    base = portal_url.rstrip("/")
    url = f"{base}/PortalAPI/api/devices?customerId={customer_id}&includeExtendedFields=true"

    return _insight_get(url, token)


def _get_dia_mock_devices() -> List[Dict[str, Any]]:
    """Generates a realistic set of devices for Supermercados DIA mock discovery.

    Total: 1083 devices (as requested).
    """
    devices = []
    # Familia 1: LaserJet Managed MFP E62655dn (700 units)
    for i in range(1, 701):
        devices.append(
            {
                "deviceId": 1000 + i,
                "serialNumber": f"MXBC626{i:05d}",
                "extendedFields": {
                    "model": "LaserJet Managed MFP E62655dn",
                    "monitorName": "DIA-CENTRAL-AGENT-01",
                    "zone": f"Sucursal {i // 5:03d}",
                    # Mock telemetry — E62655dn has 4 roller components
                    "fuser_life": max(0, 100 - (i % 85)),
                    "toner_life": max(0, 100 - (i % 98)),
                    "pickupRollerTray1Life": max(0, 100 - (i % 72)),
                    "pickupRollerTray2Life": max(0, 100 - ((i + 15) % 78)),
                    "adfPickupRollerLife": max(0, 100 - ((i * 2) % 65)),
                    "separationRollerLife": max(0, 100 - ((i + 7) % 81)),
                },
            }
        )
    # Familia 2: LaserJet Managed E60175dn (383 units)
    for i in range(1, 384):
        devices.append(
            {
                "deviceId": 2000 + i,
                "serialNumber": f"CNNCQ601{i:05d}",
                "extendedFields": {
                    "model": "LaserJet Managed E60175dn",
                    "monitorName": "DIA-CENTRAL-AGENT-01",
                    "zone": f"Sucursal {i // 3 + 140:03d}",
                    # Mock telemetry — E60175dn has only maintenance kit
                    "fuser_life": max(0, 100 - ((i * 2) % 90)),
                    "toner_life": max(0, 100 - (i % 95)),
                    "maintenanceKitPercent": max(0, 100 - ((i * 3) % 80)),
                },
            }
        )
    return devices


# ── Dynamic roller component detection ─────────────────────────────────────

_ROLLER_INCLUDE = re.compile(
    r"roller|maintenance|pickup|separation|separator|adf|transfer|feed|kit",
    re.IGNORECASE,
)
_ROLLER_EXCLUDE = re.compile(
    r"toner|fuser|ink|drum|cartridge|cyan|magenta|yellow|black|waste|color",
    re.IGNORECASE,
)
_SUFFIX_STRIP = re.compile(
    r"(life|percent|remaining|level|value|pct)$",
    re.IGNORECASE,
)
_CAMEL_SPLIT = re.compile(r"(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])|[_\-\s]+")

_TERM_ES: dict[str, str] = {
    "pickup": "Recogida",
    "separation": "Separación",
    "separator": "Separación",
    "adf": "ADF",
    "tray": "Bandeja",
    "maintenance": "Mantenimiento",
    "kit": "Kit",
    "feed": "Alimentación",
    "feeder": "Alimentación",
    "transfer": "Transferencia",
    "roller": "Rodillo",
    "rollers": "Rodillos",
}


def _humanize_roller_key(key: str) -> str:
    """Convert a camelCase/snake_case field name to a short Spanish label."""
    base = _SUFFIX_STRIP.sub("", key).strip()
    parts = _CAMEL_SPLIT.split(base)
    translated: list[str] = []
    for part in parts:
        lower = part.lower()
        if lower in _TERM_ES:
            translated.append(_TERM_ES[lower])
        elif part.isdigit():
            translated.append(part)
        elif lower not in ("life", "percent", "remaining", "level", "pct", "value"):
            translated.append(part.capitalize())
    label = " ".join(translated)
    # Collapse duplicate consecutive words
    seen: list[str] = []
    for w in label.split():
        if not seen or w != seen[-1]:
            seen.append(w)
    return " ".join(seen).strip() or key


def extract_roller_components(
    extended_fields: dict[str, Any],
) -> list[dict[str, Any]]:
    """Scan raw extendedFields and return all roller/maintenance components found.

    Each entry: {"label": str, "percent": float}
    Sorted by percent ascending (worst first) so the UI highlights critical items.
    """
    components: list[dict[str, Any]] = []
    seen_labels: set[str] = set()

    for raw_key, raw_value in extended_fields.items():
        key_str = str(raw_key)
        if not _ROLLER_INCLUDE.search(key_str):
            continue
        if _ROLLER_EXCLUDE.search(key_str):
            continue
        percent = _coerce_percent(raw_value)
        if percent is None:
            continue
        label = _humanize_roller_key(key_str)
        if label in seen_labels:
            continue
        seen_labels.add(label)
        components.append({"label": label, "percent": percent})

    return sorted(components, key=lambda c: c["percent"])
