"""Tests for /fleet/* endpoints."""

import os
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("DB_URL", "postgresql://test")

from unittest.mock import MagicMock

from backend.infrastructure.config import Settings  # noqa: E402
from backend.interface.api import get_app  # noqa: E402
from backend.interface.deps import get_error_code_repo  # noqa: E402


def _make_settings() -> Settings:
    return Settings(
        DB_URL="postgresql://test",
        API_KEY="test-key",
        SDS_WEB_USERNAME="user",
        SDS_WEB_PASSWORD="pass",
        INSIGHT_PORTAL_URL="http://mock-insight",
        INSIGHT_API_KEY="key",
        INSIGHT_API_SECRET="secret",
    )


@pytest.fixture
def client() -> TestClient:
    app = get_app(_make_settings())
    app.dependency_overrides[get_error_code_repo] = lambda: MagicMock()
    return TestClient(app, headers={"x-api-key": "test-key"})


# ── /fleet/clients ──────────────────────────────────────────────────────────

def test_list_clients_returns_200(client: TestClient) -> None:
    resp = client.get("/fleet/clients")
    assert resp.status_code == 200


def test_list_clients_contains_dia(client: TestClient) -> None:
    resp = client.get("/fleet/clients")
    data = resp.json()
    assert isinstance(data, list)
    ids = [c["id"] for c in data]
    assert "dia-central" in ids


def test_list_clients_schema(client: TestClient) -> None:
    resp = client.get("/fleet/clients")
    for c in resp.json():
        assert "id" in c
        assert "name" in c
        assert "device_count" in c
        assert isinstance(c["device_count"], int)


# ── /fleet/clients/{client_id} ──────────────────────────────────────────────

def test_get_client_dia(client: TestClient) -> None:
    with patch(
        "backend.interface.routers.fleet.search_customers",
        side_effect=Exception("no insight"),
    ):
        resp = client.get("/fleet/clients/dia-central")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == "dia-central"
    assert isinstance(data["devices"], list)
    assert len(data["devices"]) > 0


def test_get_client_not_found(client: TestClient) -> None:
    resp = client.get("/fleet/clients/nonexistent-xyz")
    assert resp.status_code == 404


def test_get_client_devices_schema(client: TestClient) -> None:
    with patch(
        "backend.interface.routers.fleet.search_customers",
        side_effect=Exception("no insight"),
    ):
        resp = client.get("/fleet/clients/dia-central")
    for d in resp.json()["devices"]:
        assert "serial" in d
        assert "location" in d


# ── /fleet/scan ─────────────────────────────────────────────────────────────

def _make_mock_info(serial: str) -> dict:
    return {
        "device_id": 1001,
        "model_name": "HP LaserJet Managed E60175dn",
        "firmware": "FS4.11.0.1",
        "zone": "Test Zone",
        "metadata": {},
    }


def _mock_alerts_ok() -> dict:
    return {"current": [], "history": []}


def _mock_alerts_warning() -> dict:
    return {"current": [{"severity": "WARNING", "description": "Low toner"}], "history": []}


def _mock_alerts_error() -> dict:
    return {"current": [{"severity": "ERROR", "description": "Paper jam"}], "history": []}


@pytest.fixture
def scan_mocks():
    with (
        patch("backend.interface.routers.fleet._insight_get_device_info", side_effect=_make_mock_info),
        patch("backend.interface.routers.fleet._insight_get_device_alerts", return_value=_mock_alerts_ok()),
        patch("backend.interface.routers.fleet.search_customers", side_effect=Exception("skip")),
        patch("backend.interface.routers.fleet.get_sds_session") as mock_sds,
        patch("backend.interface.routers.fleet.html_to_tsv", return_value=""),
    ):
        mock_sds.return_value.fetch_event_logs_html.return_value = ""
        yield


def test_scan_returns_list(client: TestClient, scan_mocks: None) -> None:
    resp = client.post("/fleet/scan", json={"client_id": "dia-central"})
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_scan_result_schema(client: TestClient, scan_mocks: None) -> None:
    resp = client.post("/fleet/scan", json={"client_id": "dia-central"})
    for row in resp.json():
        assert "serial" in row
        assert "status" in row
        assert row["status"] in ("ok", "warning", "critical", "unreachable")
        assert "active_alerts_count" in row


def test_scan_not_found_client(client: TestClient, scan_mocks: None) -> None:
    resp = client.post("/fleet/scan", json={"client_id": "nonexistent-xyz"})
    assert resp.status_code == 404


def test_scan_with_model_filter(client: TestClient, scan_mocks: None) -> None:
    resp = client.post(
        "/fleet/scan",
        json={"client_id": "dia-central", "models": ["LaserJet Managed E60175dn"]},
    )
    assert resp.status_code == 200


# ── _compute_health ──────────────────────────────────────────────────────────

def test_compute_health_ok() -> None:
    from backend.interface.routers.fleet import _compute_health
    rollers = [{"label": "Rodillo Bandeja 1", "percent": 90.0}]
    status, count, severity = _compute_health(
        {"fuser_life_percent": 80.0, "black_toner_percent": 75.0},
        rollers, [],
    )
    assert status == "ok"
    assert count == 0
    assert severity is None


def test_compute_health_critical_toner() -> None:
    from backend.interface.routers.fleet import _compute_health
    status, _, _ = _compute_health(
        {"fuser_life_percent": 80.0, "black_toner_percent": 10.0},
        [], [],
    )
    assert status == "critical"


def test_compute_health_warning_toner() -> None:
    from backend.interface.routers.fleet import _compute_health
    status, _, _ = _compute_health(
        {"fuser_life_percent": 80.0, "black_toner_percent": 20.0},
        [], [],
    )
    assert status == "warning"


def test_compute_health_critical_roller() -> None:
    from backend.interface.routers.fleet import _compute_health
    rollers = [{"label": "Rodillo ADF", "percent": 8.0}]
    status, _, _ = _compute_health(
        {"fuser_life_percent": 80.0, "black_toner_percent": 75.0},
        rollers, [],
    )
    assert status == "critical"


def test_compute_health_critical_alert() -> None:
    from backend.interface.routers.fleet import _compute_health
    status, count, severity = _compute_health(
        {"fuser_life_percent": 80.0, "black_toner_percent": 75.0},
        [], [{"severity": "ERROR", "description": "jam"}],
    )
    assert status == "critical"
    assert count == 1
    assert severity == "ERROR"


def test_compute_health_warning_alert() -> None:
    from backend.interface.routers.fleet import _compute_health
    status, count, severity = _compute_health(
        {"fuser_life_percent": 80.0, "black_toner_percent": 75.0},
        [], [{"severity": "WARNING", "description": "low toner"}],
    )
    assert status == "warning"
    assert severity == "WARNING"
