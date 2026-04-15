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
import time
from typing import Any, Dict, List, Optional

import requests

_logger = logging.getLogger(__name__)

# Cache entry: (jwt_token, expires_at_unix_timestamp)
_jwt_cache: Dict[str, tuple[str, float]] = {}
# Refresh token 1 hour before expiry (JWT lasts 24 h → cache 23 h)
_CACHE_TTL_SECONDS = 23 * 60 * 60


class InsightConfigError(Exception):
    """Raised when the Insight integration is not configured."""


class InsightAPIError(Exception):
    """Raised when the Insight API returns an unexpected error."""


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
        raise InsightAPIError(
            f"Insight login failed ({resp.status_code}): {resp.text[:200]}"
        )

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

    search_url = (
        f"{base}/PortalAPI/api/devices/search"
        f"?q=serial:{serial}&includeExtendedFields=true"
    )
    devices: List[Dict[str, Any]] = _insight_get(search_url, token)

    if not devices:
        return {
            "device_id": None,
            "model_name": None,
            "zone": None,
            "firmware": None,
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
        "insight_configured": True,
    }


def get_device_meters(
    portal_url: str,
    api_key: str,
    api_secret: str,
    device_id: int,
) -> List[Dict[str, Any]]:
    """Fetch meter history for the device to identify usage patterns."""
    token = _get_jwt(portal_url, api_key, api_secret)
    base = portal_url.rstrip("/")

    ep = f"{base}/PortalAPI/api/devices/{device_id}/meters/history"
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
        current = _insight_get(
            f"{base}/PortalAPI/api/devices/{device_id}/alerts/current", token
        )
    except InsightAPIError as exc:
        _logger.warning("Could not fetch current alerts for device %s: %s", device_id, exc)

    # 3. Fetch alert history
    history: List[Dict[str, Any]] = []
    try:
        history = _insight_get(
            f"{base}/PortalAPI/api/devices/{device_id}/alerts/history", token
        )
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
