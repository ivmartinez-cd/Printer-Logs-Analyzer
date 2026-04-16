"""Tests para el endpoint GET /insight/devices/{serial}/alerts."""

from __future__ import annotations

import os

os.environ.setdefault("DB_URL", "postgresql://test")
os.environ.setdefault("API_KEY", "dev")

from unittest.mock import MagicMock, patch

import pytest
from backend.infrastructure.config import Settings
from backend.interface.api import get_app
from fastapi.testclient import TestClient

_HEADERS = {"x-api-key": "dev"}


@pytest.fixture(autouse=True)
def no_rate_limit(monkeypatch: pytest.MonkeyPatch) -> None:
    from backend.interface.rate_limiter import limiter

    monkeypatch.setattr(limiter, "limit", lambda *args, **kwargs: lambda f: f)


def _make_settings(with_insight: bool = True) -> Settings:
    kwargs: dict = {"DB_URL": "postgresql://test", "API_KEY": "dev"}
    if with_insight:
        kwargs["INSIGHT_PORTAL_URL"] = "https://test-portal.example.com"
        kwargs["INSIGHT_API_KEY"] = "test-key"
        kwargs["INSIGHT_API_SECRET"] = "test-secret"
    return Settings(**kwargs)


_MOCK_ALERT_RESPONSE = {
    "serial": "CNNCQ520HG",
    "device_id": 142699,
    "model": "LaserJet Managed E60175dn",
    "zone": "ZUC Quilmes",
    "firmware": "2406048_051375",
    "current": [],
    "history": [
        {
            "deviceId": 142699,
            "date": "2026-04-11T15:42:36.000Z",
            "engineCycles": 256799,
            "trainingLevel": 3,
            "severityLevel": 3,
            "alertClass": "SYSTEM_WARNING",
            "mibCode": 22,
            "description": "En pausa",
            "cleared": "2026-04-11T16:12:26.000Z",
        }
    ],
    "insight_configured": True,
}


# ---------------------------------------------------------------------------
# Test 1: Returns insight_configured: False when env vars are not set
# ---------------------------------------------------------------------------


def test_insight_endpoint_returns_not_configured_when_no_env() -> None:
    """Returns {insight_configured: false} gracefully when integration is not set up."""
    client = TestClient(get_app(settings=_make_settings(with_insight=False)))
    response = client.get("/insight/devices/CNNCQ520HG/alerts", headers=_HEADERS)
    assert response.status_code == 200
    assert response.json() == {"insight_configured": False}


# ---------------------------------------------------------------------------
# Test 2: Returns alert data when Insight is configured and serial exists
# ---------------------------------------------------------------------------


@patch("backend.interface.routers.sds._insight_get_device_alerts")
def test_insight_endpoint_returns_alerts(mock_get: MagicMock) -> None:
    """Returns alert data when the portal responds correctly."""
    mock_get.return_value = _MOCK_ALERT_RESPONSE

    client = TestClient(get_app(settings=_make_settings(with_insight=True)))
    response = client.get("/insight/devices/CNNCQ520HG/alerts", headers=_HEADERS)

    assert response.status_code == 200
    data = response.json()
    assert data["insight_configured"] is True
    assert data["serial"] == "CNNCQ520HG"
    assert data["device_id"] == 142699
    assert isinstance(data["history"], list)
    assert len(data["history"]) == 1
    assert data["history"][0]["alertClass"] == "SYSTEM_WARNING"
    mock_get.assert_called_once()


# ---------------------------------------------------------------------------
# Test 3: Returns 200 with empty lists when serial is not found in portal
# ---------------------------------------------------------------------------


@patch("backend.interface.routers.sds._insight_get_device_alerts")
def test_insight_endpoint_returns_empty_when_serial_not_found(mock_get: MagicMock) -> None:
    """When the serial doesn't exist in the portal, returns empty alert lists."""
    mock_get.return_value = {
        "serial": "NOTFOUND",
        "device_id": None,
        "model": None,
        "zone": None,
        "current": [],
        "history": [],
        "insight_configured": True,
    }

    client = TestClient(get_app(settings=_make_settings(with_insight=True)))
    response = client.get("/insight/devices/NOTFOUND/alerts", headers=_HEADERS)

    assert response.status_code == 200
    data = response.json()
    assert data["device_id"] is None
    assert data["current"] == []
    assert data["history"] == []


# ---------------------------------------------------------------------------
# Test 4: Returns 401 with wrong API key
# ---------------------------------------------------------------------------


def test_insight_endpoint_rejects_wrong_api_key() -> None:
    """Returns 401 if x-api-key is incorrect."""
    client = TestClient(
        get_app(settings=_make_settings(with_insight=True)),
        raise_server_exceptions=False,
    )
    response = client.get(
        "/insight/devices/CNNCQ520HG/alerts",
        headers={"x-api-key": "wrong-key"},
    )
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# Test 5: Returns 502 when Insight portal is unreachable
# ---------------------------------------------------------------------------


@patch("backend.interface.routers.sds._insight_get_device_alerts")
def test_insight_endpoint_returns_502_on_portal_error(mock_get: MagicMock) -> None:
    """Returns 502 when the Insight portal API call fails."""
    from backend.application.services.insight_service import InsightAPIError

    mock_get.side_effect = InsightAPIError("Connection refused")

    client = TestClient(
        get_app(settings=_make_settings(with_insight=True)),
        raise_server_exceptions=False,
    )
    response = client.get("/insight/devices/CNNCQ520HG/alerts", headers=_HEADERS)
    assert response.status_code == 502
    assert "Connection refused" in response.json()["detail"]


# ---------------------------------------------------------------------------
# Test 6: Serial is normalized to uppercase
# ---------------------------------------------------------------------------


@patch("backend.interface.routers.sds._insight_get_device_alerts")
def test_insight_endpoint_normalizes_serial_to_uppercase(mock_get: MagicMock) -> None:
    """Serial number is uppercased before forwarding to the portal."""
    mock_get.return_value = {**_MOCK_ALERT_RESPONSE, "serial": "CNNCQ520HG"}

    client = TestClient(get_app(settings=_make_settings(with_insight=True)))
    response = client.get("/insight/devices/cnncq520hg/alerts", headers=_HEADERS)

    assert response.status_code == 200
    _args, _kwargs = mock_get.call_args
    # The 4th positional argument is the serial
    assert _args[3] == "CNNCQ520HG"
