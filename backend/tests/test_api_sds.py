import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from backend.interface.api import get_app
from backend.infrastructure.config import Settings

@pytest.fixture(autouse=True)
def no_rate_limit(monkeypatch: pytest.MonkeyPatch) -> None:
    from backend.interface.api import limiter
    monkeypatch.setattr(limiter, "limit", lambda *args, **kwargs: lambda f: f)

@pytest.fixture
def mock_settings():
    return Settings(
        DB_URL="postgresql://test",
        API_KEY="dev",
        SDS_WEB_USERNAME="testuser",
        SDS_WEB_PASSWORD="testpassword"
    )

@pytest.fixture
def client(mock_settings):
    app = get_app(settings=mock_settings)
    return TestClient(app)

_HEADERS = {"x-api-key": "dev"}

@patch("backend.interface.api.get_sds_session")
@patch("backend.interface.api.html_to_tsv")
def test_extract_logs_success(mock_tsv, mock_sds_factory, client):
    """Test successful log extraction via API."""
    mock_sds = MagicMock()
    mock_sds_factory.return_value = mock_sds
    mock_sds.search_device.return_value = "12345"
    mock_sds.fetch_event_logs_html.return_value = "<html>...</html>"
    mock_tsv.return_value = "HeaderCol\nDataLine1\nDataLine2"
    
    response = client.post(
        "/sds/extract-logs",
        json={"serial": "MXSCS7Q00Q"},
        headers=_HEADERS
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["serial"] == "MXSCS7Q00Q"
    assert data["event_count"] == 2
    assert "DataLine1" in data["logs_text"]
    
    mock_sds.search_device.assert_called_once_with("MXSCS7Q00Q")
    mock_sds.fetch_event_logs_html.assert_called_once_with("12345", 30)

def test_extract_logs_unauthorized(client):
    """Verify that the endpoint requires a valid API key."""
    response = client.post("/sds/extract-logs", json={"serial": "123"}, headers={"x-api-key": "wrong"})
    assert response.status_code == 401

@patch("backend.interface.api.get_sds_session")
def test_extract_logs_not_found(mock_sds_factory, client):
    """Test fallback when device is not found."""
    from backend.application.services.sds_web_service import SDSWebError
    mock_sds = MagicMock()
    mock_sds_factory.return_value = mock_sds
    mock_sds.search_device.side_effect = SDSWebError("Device not found")
    
    response = client.post(
        "/sds/extract-logs",
        json={"serial": "NOTFOUND"},
        headers=_HEADERS
    )
    
    assert response.status_code == 502
    assert "Device not found" in response.json()["detail"]

def test_extract_logs_missing_serial(client):
    """Verify that serial parameter is required."""
    response = client.post("/sds/extract-logs", headers=_HEADERS)
    assert response.status_code == 422 # FastAPI validation error
