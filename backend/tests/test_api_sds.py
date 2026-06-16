from unittest.mock import MagicMock, patch

import pytest
from backend.infrastructure.config import Settings
from backend.interface.api import get_app
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def no_rate_limit(monkeypatch: pytest.MonkeyPatch) -> None:
    from backend.interface.rate_limiter import limiter

    monkeypatch.setattr(limiter, "limit", lambda *args, **kwargs: lambda f: f)


@pytest.fixture
def mock_settings():
    return Settings(
        DB_URL="postgresql://test",
        API_KEY="dev",
        SDS_WEB_USERNAME="testuser",
        SDS_WEB_PASSWORD="testpassword",
        INSIGHT_PORTAL_URL="https://testportal",
        INSIGHT_API_KEY="key",
        INSIGHT_API_SECRET="secret",
    )


@pytest.fixture
def client(mock_settings):
    app = get_app(settings=mock_settings)
    return TestClient(app)


_HEADERS = {"x-api-key": "dev"}


@patch("backend.interface.routers.sds._insight_get_device_consumables")
@patch("backend.interface.routers.sds._insight_get_device_info")
@patch("backend.interface.routers.sds.get_sds_session")
@patch("backend.interface.routers.sds.html_to_tsv")
def test_extract_logs_success(
    mock_tsv, mock_sds_factory, mock_insight_info, mock_insight_consumables, client, mock_settings
):
    """Test successful log extraction via API."""
    mock_insight_info.return_value = {
        "device_id": 12345,
        "model_name": "HP LaserJet",
        "zone": "Zone",
        "firmware": "1.2.3",
    }
    mock_insight_consumables.return_value = [{"type": "TONER", "percentLeft": 100}]

    mock_sds = MagicMock()
    mock_sds_factory.return_value = mock_sds
    mock_sds.fetch_event_logs_html.return_value = "<html>...</html>"
    mock_tsv.return_value = "HeaderCol\nDataLine1\nDataLine2"

    mock_sol_repo = MagicMock()
    mock_sol_repo.get_model_ids_with_solutions.return_value = []

    from backend.interface.deps import get_error_solution_repo

    app = client.app
    app.dependency_overrides[get_error_solution_repo] = lambda: mock_sol_repo

    try:
        response = client.post("/sds/extract-logs", json={"serial": "MXSCS7Q00Q"}, headers=_HEADERS)

        assert response.status_code == 200
        data = response.json()
        assert data["serial"] == "MXSCS7Q00Q"
        assert data["event_count"] == 2
        assert "DataLine1" in data["logs_text"]

        mock_insight_info.assert_called_once_with(
            mock_settings.insight_portal_url,
            mock_settings.insight_api_key,
            mock_settings.insight_api_secret,
            "MXSCS7Q00Q",
        )
        mock_sds.fetch_event_logs_html.assert_called_once_with("12345", 30)
    finally:
        app.dependency_overrides.clear()


def test_extract_logs_unauthorized(client):
    """Verify that the endpoint requires a valid API key."""
    response = client.post(
        "/sds/extract-logs", json={"serial": "123"}, headers={"x-api-key": "wrong"}
    )
    assert response.status_code == 401


@patch("backend.interface.routers.sds._insight_get_device_info")
def test_extract_logs_fallback_on_error(mock_insight_info, client):
    """Verify that the endpoint falls back to mock data if Insight API fails."""
    mock_insight_info.side_effect = Exception("API Down")

    response = client.post("/sds/extract-logs", json={"serial": "ANYSERIAL"}, headers=_HEADERS)

    assert response.status_code == 200
    data = response.json()
    assert data["serial"] == "ANYSERIAL"
    assert data["firmware"] == "N/A"


def test_extract_logs_missing_serial(client):
    """Verify that serial parameter is required."""
    response = client.post("/sds/extract-logs", headers=_HEADERS)
    assert response.status_code == 422  # FastAPI validation error


@patch("backend.interface.routers.sds.get_sds_session")
@patch("backend.interface.routers.sds._insight_get_device_info")
def test_remote_ews_success(mock_insight_info, mock_sds_factory, client):
    """Test successful retrieval of the remote EWS access link."""
    mock_insight_info.return_value = {"device_id": 239877, "model_name": "HP LaserJet", "firmware": "1.2.3"}

    mock_sds = MagicMock()
    mock_sds_factory.return_value = mock_sds
    mock_sds.fetch_remote_ews_url.return_value = "https://ews.hpjamservices.com/connection/TOKEN"

    response = client.get("/sds/devices/MXSCS7Q00Q/remote-ews", headers=_HEADERS)

    assert response.status_code == 200
    data = response.json()
    assert data["serial"] == "MXSCS7Q00Q"
    assert data["device_id"] == "239877"
    assert data["ews_url"] == "https://ews.hpjamservices.com/connection/TOKEN"
    mock_sds.fetch_remote_ews_url.assert_called_once_with("239877")


@patch("backend.interface.routers.sds.get_sds_session")
@patch("backend.interface.routers.sds._insight_get_device_info")
def test_remote_ews_not_available(mock_insight_info, mock_sds_factory, client):
    """Returns 404 when the portal has no remote EWS link for the device."""
    mock_insight_info.return_value = {"device_id": 239877, "model_name": "HP LaserJet", "firmware": "1.2.3"}

    mock_sds = MagicMock()
    mock_sds_factory.return_value = mock_sds
    mock_sds.fetch_remote_ews_url.return_value = None

    response = client.get("/sds/devices/MXSCS7Q00Q/remote-ews", headers=_HEADERS)
    assert response.status_code == 404


@patch("backend.interface.routers.sds.get_sds_session")
@patch("backend.interface.routers.sds._insight_get_device_info")
def test_refresh_hp_cache_success(mock_insight_info, mock_sds_factory, client):
    """Test successful request of the HP data cache refresh."""
    mock_insight_info.return_value = {"device_id": 239877, "model_name": "HP LaserJet", "firmware": "1.2.3"}

    mock_sds = MagicMock()
    mock_sds_factory.return_value = mock_sds
    mock_sds.refresh_hp_data_cache.return_value = [
        {"operation": "RefreshHPCloudDeviceActionCache", "sent": "16-jun-2026 10:00:00"}
    ]

    response = client.post("/sds/devices/MXSCS7Q00Q/refresh-cache", headers=_HEADERS)

    assert response.status_code == 200
    data = response.json()
    assert data["serial"] == "MXSCS7Q00Q"
    assert data["device_id"] == "239877"
    assert data["status"] == "requested"
    assert data["baseline"][0]["operation"] == "RefreshHPCloudDeviceActionCache"
    mock_sds.refresh_hp_data_cache.assert_called_once_with("239877")


@patch("backend.interface.routers.sds.get_sds_session")
@patch("backend.interface.routers.sds._insight_get_device_info")
def test_hp_operations_success(mock_insight_info, mock_sds_factory, client):
    """Test retrieval of the HP Smart operations status table."""
    mock_insight_info.return_value = {"device_id": 239877, "model_name": "HP LaserJet", "firmware": "1.2.3"}

    mock_sds = MagicMock()
    mock_sds_factory.return_value = mock_sds
    mock_sds.get_hp_operations.return_value = [
        {
            "operation": "RefreshHPCloudDeviceActionCache",
            "sent": "16-jun-2026 15:06:28",
            "sent_by": "ilmartinez",
            "last_known_state": "PartialSuccess",
            "last_state_updated": "16-jun-2026 15:08:54",
            "last_state_requested": "16-jun-2026 15:09:46",
        }
    ]

    response = client.get("/sds/devices/MXSCS7Q00Q/hp-operations", headers=_HEADERS)

    assert response.status_code == 200
    data = response.json()
    assert data["device_id"] == "239877"
    assert data["operations"][0]["operation"] == "RefreshHPCloudDeviceActionCache"
    assert data["operations"][0]["last_known_state"] == "PartialSuccess"
    mock_sds.get_hp_operations.assert_called_once_with("239877")


@patch("backend.interface.routers.sds._insight_get_device_info")
def test_refresh_hp_cache_device_not_found(mock_insight_info, client):
    """Returns 404 when the device is not found in the Insight Portal."""
    mock_insight_info.return_value = {"device_id": None, "model_name": None, "firmware": None}

    response = client.post("/sds/devices/UNKNOWN/refresh-cache", headers=_HEADERS)
    assert response.status_code == 404


def test_refresh_hp_cache_unauthorized(client):
    """Verify that the endpoint requires a valid API key."""
    response = client.post("/sds/devices/MXSCS7Q00Q/refresh-cache", headers={"x-api-key": "wrong"})
    assert response.status_code == 401


@patch("backend.interface.routers.sds._insight_get_device_info")
def test_remote_ews_device_not_found(mock_insight_info, client):
    """Returns 404 when the device is not found in the Insight Portal."""
    mock_insight_info.return_value = {"device_id": None, "model_name": None, "firmware": None}

    response = client.get("/sds/devices/UNKNOWN/remote-ews", headers=_HEADERS)
    assert response.status_code == 404


def test_remote_ews_unauthorized(client):
    """Verify that the endpoint requires a valid API key."""
    response = client.get("/sds/devices/MXSCS7Q00Q/remote-ews", headers={"x-api-key": "wrong"})
    assert response.status_code == 401
