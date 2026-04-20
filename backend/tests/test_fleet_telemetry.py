from unittest.mock import MagicMock, patch

import pytest
from backend.application.services import insight_service
from backend.infrastructure.config import Settings
from backend.interface.api import get_app
from backend.interface.deps import get_error_code_repo
from backend.interface.routers import fleet as fleet_router
from fastapi.testclient import TestClient

_HEADERS = {"x-api-key": "dev"}
_SAMPLE_TSV = (
    "Type\tCode\tDate\tCounter\tFirmware\tHelp\n"
    "Error\t13.B9.A2\t10-mar-2026 20:18:18\t236463\t2502087_007707\tFuser jam\n"
    "Warning\t10.00.58\t10-mar-2026 10:12:03\t236444\t2502087_007707\tLow toner\n"
)
_LATEST_FIRST_TSV = (
    "Type\tCode\tDate\tCounter\tFirmware\tHelp\n"
    "Info\t34.02.01\t18-abr-2026 20:04:15\t784610\t2509087_000120\t-\n"
    "Error\t13.B2.D2\t18-abr-2026 14:23:02\t784474\t2509087_000120\tPaper delay jam\n"
    "Warning\t53.B1.02\t30-mar-2026 14:22:26\t784451\t2509087_000120\tTray Z roller\n"
)


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


@pytest.fixture(autouse=True)
def no_rate_limit(monkeypatch: pytest.MonkeyPatch) -> None:
    from backend.interface.rate_limiter import limiter

    monkeypatch.setattr(limiter, "limit", lambda *args, **kwargs: lambda fn: fn)


@pytest.fixture
def client() -> TestClient:
    app = get_app(settings=_make_settings())
    # Mock the catalog repository to avoid DB calls and attribute errors during fleet scans
    mock_repo = MagicMock()
    app.dependency_overrides[get_error_code_repo] = lambda: mock_repo
    return TestClient(app)


def test_list_clients_endpoint_returns_summary(monkeypatch: pytest.MonkeyPatch, client: TestClient):
    monkeypatch.setattr(
        fleet_router._fleet_repo,
        "list_clients",
        lambda: [
            {
                "id": "demo",
                "name": "Cliente Demo",
                "device_count": 1,
                "is_dynamic": False,
            }
        ],
    )

    response = client.get("/fleet/clients", headers=_HEADERS)

    assert response.status_code == 200
    assert response.json() == [
        {
            "id": "demo",
            "name": "Cliente Demo",
            "device_count": 1,
            "is_dynamic": False,
        }
    ]


@patch("backend.interface.routers.fleet.get_sds_session")
@patch("backend.interface.routers.fleet.html_to_tsv")
@patch("backend.interface.routers.fleet._insight_get_device_info")
def test_scan_fleet_maps_telemetry_from_metadata(
    mock_insight_info,
    mock_tsv,
    mock_sds_factory,
    monkeypatch: pytest.MonkeyPatch,
    client: TestClient,
) -> None:
    monkeypatch.setattr(
        fleet_router._fleet_repo,
        "get_client",
        lambda client_id: {
            "id": client_id,
            "name": "Cliente Demo",
            "is_dynamic": False,
            "devices": [
                {
                    "serial": "MXSCS7Q00Q",
                    "location": "Lab",
                    "model": "HP LaserJet Managed MFP",
                }
            ],
        },
    )
    mock_insight_info.return_value = {
        "device_id": 12345,
        "model_name": "HP LaserJet Managed MFP",
        "firmware": "FS4.11.0.1",
        "metadata": {
            "fuser_life": 14,
            "toner_life": "28",
        },
        "raw_extended": {"maintenanceKitPercent": 61},
    }
    mock_sds = MagicMock()
    mock_sds_factory.return_value = mock_sds
    mock_sds.fetch_event_logs_html.return_value = "<html />"
    mock_tsv.return_value = _SAMPLE_TSV

    response = client.post("/fleet/scan", json={"client_id": "demo"}, headers=_HEADERS)

    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 1
    assert payload[0]["status"] in ("critical", "warning", "ok")
    assert payload[0]["error_count"] == 1
    assert payload[0]["warning_count"] == 1
    assert payload[0]["fuser_life_percent"] == 14.0
    assert payload[0]["black_toner_percent"] == 28.0
    rollers = payload[0]["roller_components"]
    assert len(rollers) == 1
    assert rollers[0]["percent"] == 61.0


@patch("backend.interface.routers.fleet.get_sds_session")
@patch("backend.interface.routers.fleet.html_to_tsv")
@patch("backend.interface.routers.fleet._insight_get_device_info")
def test_scan_fleet_generates_deterministic_telemetry_when_metadata_missing(
    mock_insight_info,
    mock_tsv,
    mock_sds_factory,
    monkeypatch: pytest.MonkeyPatch,
    client: TestClient,
) -> None:
    monkeypatch.setattr(
        fleet_router._fleet_repo,
        "get_client",
        lambda client_id: {
            "id": client_id,
            "name": "Cliente Demo",
            "is_dynamic": False,
            "devices": [
                {
                    "serial": "MXSCS7Q00Q",
                    "location": "Lab",
                    "model": "HP LaserJet Managed MFP",
                }
            ],
        },
    )
    mock_insight_info.return_value = {
        "device_id": 12345,
        "model_name": "HP LaserJet Managed MFP",
        "firmware": "FS4.11.0.1",
        "metadata": {},
    }
    mock_sds = MagicMock()
    mock_sds_factory.return_value = mock_sds
    mock_sds.fetch_event_logs_html.return_value = "<html />"
    mock_tsv.return_value = _SAMPLE_TSV

    first_response = client.post("/fleet/scan", json={"client_id": "demo"}, headers=_HEADERS)
    second_response = client.post("/fleet/scan", json={"client_id": "demo"}, headers=_HEADERS)

    first_payload = first_response.json()[0]
    second_payload = second_response.json()[0]

    assert first_response.status_code == 200
    assert second_response.status_code == 200
    assert first_payload["fuser_life_percent"] > 0
    assert first_payload["black_toner_percent"] > 0
    assert first_payload["fuser_life_percent"] == second_payload["fuser_life_percent"]
    assert first_payload["black_toner_percent"] == second_payload["black_toner_percent"]


@patch("backend.interface.routers.fleet.get_sds_session")
@patch("backend.interface.routers.fleet.html_to_tsv")
@patch("backend.interface.routers.fleet._insight_get_device_info")
def test_scan_fleet_uses_most_recent_event_for_last_event_date(
    mock_insight_info,
    mock_tsv,
    mock_sds_factory,
    monkeypatch: pytest.MonkeyPatch,
    client: TestClient,
) -> None:
    monkeypatch.setattr(
        fleet_router._fleet_repo,
        "get_client",
        lambda client_id: {
            "id": client_id,
            "name": "Cliente Demo",
            "is_dynamic": False,
            "devices": [
                {
                    "serial": "PHNCT54038",
                    "location": "CDD Garin",
                    "model": "HP LaserJet Managed MFP",
                }
            ],
        },
    )
    mock_insight_info.return_value = {
        "device_id": 12345,
        "model_name": "HP LaserJet Managed MFP",
        "firmware": "FS4.11.0.1",
        "metadata": {},
    }
    mock_sds = MagicMock()
    mock_sds_factory.return_value = mock_sds
    mock_sds.fetch_event_logs_html.return_value = "<html />"
    mock_tsv.return_value = _LATEST_FIRST_TSV

    response = client.post("/fleet/scan", json={"client_id": "demo"}, headers=_HEADERS)

    assert response.status_code == 200
    assert response.json()[0]["last_event_date"] == "2026-04-18T20:04:15"


def test_get_device_info_normalizes_extended_field_telemetry(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(insight_service, "_get_jwt", lambda *args: "token")
    monkeypatch.setattr(
        insight_service,
        "_insight_get",
        lambda url, token: [
            {
                "deviceId": 99,
                "extendedFields": {
                    "model": "HP LaserJet Managed MFP",
                    "zone": "Lab",
                    "firmwareVersion": "FS4.11.0.1",
                    "fuserLifePercent": "22%",
                    "blackTonerPercent": 37,
                    "maintenanceKitPercent": "61",
                },
            }
        ],
    )

    info = insight_service.get_device_info(
        "https://portal.example.com",
        "key",
        "secret",
        "MXSCS7Q00Q",
    )

    assert info["device_id"] == 99
    assert info["metadata"]["fuser_life"] == 22.0
    assert info["metadata"]["toner_life"] == 37.0
    assert info["metadata"]["rollers_life"] == 61.0
