
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient
from backend.interface.api import get_app
from backend.interface.deps import get_error_code_repo
from backend.interface.routers import fleet as fleet_router
from backend.infrastructure.config import Settings

_HEADERS = {"x-api-key": "dev"}
_SAMPLE_TSV = "Type\tCode\tDate\tCounter\tFirmware\tHelp\nInfo\t00.00.00\t10-mar-2026 10:00:00\t100\tFW\tOK\n"

def _make_settings() -> Settings:
    return Settings(
        DB_URL="postgresql://test",
        API_KEY="dev",
        SDS_WEB_USERNAME="test-user",
        SDS_WEB_PASSWORD="test-password",
        INSIGHT_PORTAL_URL="https://portal.example.com",
        INSIGHT_API_KEY="key",
        INSIGHT_API_SECRET="secret",
    )

@pytest.fixture
def client() -> TestClient:
    app = get_app(settings=_make_settings())
    mock_repo = MagicMock()
    app.dependency_overrides[get_error_code_repo] = lambda: mock_repo
    return TestClient(app)

@patch("backend.interface.routers.fleet.get_sds_session")
@patch("backend.interface.routers.fleet.html_to_tsv")
@patch("backend.interface.routers.fleet._insight_get_device_info")
@patch("backend.interface.routers.fleet._insight_get_device_consumables")
def test_scan_fleet_syncs_realtime_consumables(
    mock_consumables,
    mock_insight_info,
    mock_tsv,
    mock_sds_factory,
    monkeypatch: pytest.MonkeyPatch,
    client: TestClient,
) -> None:
    # Setup: serial that would trigger 20%/57% in seed data
    serial = "PHNCS470HF"
    
    monkeypatch.setattr(
        fleet_router._fleet_repo,
        "get_client",
        lambda client_id: {
            "id": client_id,
            "name": "Cliente Demo",
            "is_dynamic": False,
            "devices": [{"serial": serial, "location": "Lab", "model": "HP LaserJet Managed MFP"}],
        },
    )
    
    # Mock search info returning empty metadata (triggers fallback)
    mock_insight_info.return_value = {
        "device_id": 12345,
        "model_name": "HP LaserJet Managed MFP",
        "firmware": "FS4.11",
        "metadata": {}, # This currently triggers fallback to 20/57
        "raw_extended": {}
    }
    
    # Mock real-time consumables (what we want to see)
    mock_consumables.return_value = [
        {"type": "TONER", "percentLeft": 68.0, "sku": "W9004MC"},
        {"type": "FUSER", "percentLeft": 82.0, "sku": "L0H24A"},
        {"type": "MAINTENANCE_KIT", "percentLeft": 77.0, "sku": "MK"}
    ]
    
    mock_sds = MagicMock()
    mock_sds_factory.return_value = mock_sds
    mock_sds.fetch_event_logs_html.return_value = "<html />"
    mock_tsv.return_value = _SAMPLE_TSV

    response = client.post("/fleet/scan", json={"client_id": "demo"}, headers=_HEADERS)

    assert response.status_code == 200
    payload = response.json()[0]
    
    # These should match the consumables mock, NOT the seed data (20/57)
    assert payload["black_toner_percent"] == 68.0
    assert payload["fuser_life_percent"] == 82.0
    
    # Check roller components too
    rollers = payload["roller_components"]
    assert any(r["label"] == "Mantenimiento Kit" and r["percent"] == 77.0 for r in rollers)
