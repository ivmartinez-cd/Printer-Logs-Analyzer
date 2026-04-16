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
    mock_tsv, mock_sds_factory, mock_insight_info, mock_insight_consumables, client
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

    # Mock repositories to avoid DB dependency in these tests
    with (
        patch("backend.interface.routers.sds.PrinterModelRepository") as mock_repo_cls,
        patch("backend.interface.routers.sds.ErrorSolutionRepository") as mock_sol_repo_cls,
    ):
        mock_repo = mock_repo_cls.return_value
        mock_repo.find_best_match.return_value = None
        mock_sol_repo = mock_sol_repo_cls.return_value
        mock_sol_repo.get_model_ids_with_solutions.return_value = []

    response = client.post("/sds/extract-logs", json={"serial": "MXSCS7Q00Q"}, headers=_HEADERS)

    assert response.status_code == 200
    data = response.json()
    assert data["serial"] == "MXSCS7Q00Q"
    assert data["event_count"] == 2
    assert "DataLine1" in data["logs_text"]

    mock_insight_info.assert_called_once_with("https://testportal", "key", "secret", "MXSCS7Q00Q")
    mock_sds.fetch_event_logs_html.assert_called_once_with("12345", 30)


def test_extract_logs_unauthorized(client):
    """Verify that the endpoint requires a valid API key."""
    response = client.post(
        "/sds/extract-logs", json={"serial": "123"}, headers={"x-api-key": "wrong"}
    )
    assert response.status_code == 401


@patch("backend.interface.routers.sds._insight_get_device_info")
def test_extract_logs_not_found(mock_insight_info, client):
    """Test fallback when device is not found."""
    mock_insight_info.return_value = {"device_id": None, "firmware": None}

    response = client.post("/sds/extract-logs", json={"serial": "NOTFOUND"}, headers=_HEADERS)

    assert response.status_code == 404
    assert "Dispositivo no encontrado" in response.json()["detail"]


def test_extract_logs_missing_serial(client):
    """Verify that serial parameter is required."""
    response = client.post("/sds/extract-logs", headers=_HEADERS)
    assert response.status_code == 422  # FastAPI validation error
