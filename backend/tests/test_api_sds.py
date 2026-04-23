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
