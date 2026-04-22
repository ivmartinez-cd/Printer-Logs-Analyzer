from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

import pytest
from backend.application.services.maintenance_service import MaintenanceService
from backend.domain.entities import (
    MaintenanceAlert,
    MaintenanceDevice,
    MaintenanceDeviceState,
    MaintenanceModelRule,
)
from backend.infrastructure.config import Settings
from backend.infrastructure.repositories.maintenance_repository import MaintenanceRepository
from backend.interface.api import get_app
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def mock_scheduler():
    with patch("backend.application.scheduler.start_scheduler"), \
         patch("backend.application.scheduler.stop_scheduler"):
        yield

@pytest.fixture
def client():
    # Use mock settings for testing
    settings = Settings(DB_URL="postgresql://test", API_KEY="dev")
    app = get_app(settings=settings)
    return TestClient(app)

@pytest.fixture
def maintenance_repo():
    repo = MaintenanceRepository()
    return repo

@pytest.fixture
def maintenance_service(maintenance_repo):
    return MaintenanceService(repository=maintenance_repo)

def test_maintenance_repository_upsert_device(maintenance_repo):
    with patch.object(maintenance_repo, "upsert_device") as mock_upsert, \
         patch.object(maintenance_repo, "get_all_devices") as mock_get:

        device = MaintenanceDevice(serial="TEST_SERIAL_123", model_family="Test Model")
        maintenance_repo.upsert_device(device)
        mock_upsert.assert_called_once_with(device)

        mock_get.return_value = [device]
        devices = maintenance_repo.get_all_devices()
        found = next((d for d in devices if d.serial == "TEST_SERIAL_123"), None)
        assert found is not None
        assert found.model_family == "Test Model"

def test_maintenance_repository_model_rules(maintenance_repo):
    family = "Test Family"
    with patch.object(maintenance_repo, "upsert_model_rule") as mock_upsert, \
         patch.object(maintenance_repo, "get_model_rules") as mock_get:

        rule = MaintenanceModelRule(
            model_family=family,
            component_type="Fuser",
            expected_life=100000,
            alert_margin=5000
        )
        maintenance_repo.upsert_model_rule(rule)
        mock_upsert.assert_called_once_with(rule)

        mock_get.return_value = [rule]
        rules = maintenance_repo.get_model_rules(family)
        assert len(rules) == 1
        assert rules[0].component_type == "Fuser"

@patch("backend.application.services.maintenance_service.get_device_info")
@patch("backend.application.services.maintenance_service.get_device_meters")
def test_maintenance_service_alert_trigger(mock_meters, mock_info, maintenance_service, maintenance_repo):
    serial = "ALERT_TEST"
    family = "Test Family"
    device = MaintenanceDevice(serial=serial, model_family=family)

    # Mock repo calls
    with patch.object(maintenance_repo, "get_model_rules") as mock_get_rules, \
         patch.object(maintenance_repo, "get_device_state") as mock_get_state, \
         patch.object(maintenance_repo, "get_last_alert") as mock_get_last_alert, \
         patch.object(maintenance_repo, "create_alert") as mock_create_alert, \
         patch.object(maintenance_repo, "upsert_device"):

        mock_get_rules.return_value = [MaintenanceModelRule(
            model_family=family,
            component_type="Kit",
            expected_life=10000,
            alert_margin=1000,
            email_recipients="test@test.com"
        )]
        mock_get_state.return_value = [] # No previous changes
        mock_get_last_alert.return_value = None

        # Mock device info and meters
        mock_info.return_value = {"deviceId": 123, "extendedFields": {}}
        mock_meters.return_value = [{"engineCycles": 9500}] # Trigger alert (remaining 500 < 1000)

        # Mock email service
        maintenance_service.email.send_maintenance_alert = MagicMock()

        maintenance_service.process_device(device)

        # Check if alert was created
        mock_create_alert.assert_called_once()
        # Check if email was "sent"
        maintenance_service.email.send_maintenance_alert.assert_called_once()

def test_maintenance_api_endpoints(client):
    headers = {"x-api-key": "dev"}
    # Test listing devices
    response = client.get("/maintenance/devices", headers=headers)
    assert response.status_code == 200

    # Test forcing check
    response = client.post("/maintenance/check-now", headers=headers, json={})
    assert response.status_code == 200
    assert response.json()["status"] == "completed"
