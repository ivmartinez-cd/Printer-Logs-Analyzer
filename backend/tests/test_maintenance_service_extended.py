import unittest
from datetime import datetime
from unittest.mock import MagicMock, patch

from backend.application.services.maintenance_service import MaintenanceService
from backend.domain.entities import (
    MaintenanceAlert,
    MaintenanceDevice,
    MaintenanceDeviceState,
    MaintenanceHistory,
    MaintenanceModelRule,
)


class TestMaintenanceServiceExtended(unittest.TestCase):
    def setUp(self):
        self.mock_repo = MagicMock()
        self.mock_email = MagicMock()
        self.service = MaintenanceService(repository=self.mock_repo, email_service=self.mock_email)
        # Force emails enabled for tests
        self.service.settings.maintenance_emails_enabled = True

    @patch("backend.application.services.maintenance_service.search_devices_by_model")
    def test_sync_and_check_all_with_discovery(self, mock_search):
        self.mock_repo.get_all_model_families.return_value = ["FamilyA"]
        mock_search.return_value = [{"serialNumber": "S1", "modelName": "FamilyA"}]
        self.mock_repo.get_all_devices.return_value = [
            MaintenanceDevice(serial="S1", model_family="FamilyA", is_active=True)
        ]

        # Test full flow
        self.service.sync_and_check_all(discover=True)

        self.mock_repo.upsert_device.assert_called()
        self.mock_repo.get_all_devices.assert_called()

    @patch("backend.application.services.maintenance_service.get_device_meters")
    @patch("backend.application.services.maintenance_service.get_device_info")
    def test_process_device_full_logic(self, mock_info, mock_meters):
        device = MaintenanceDevice(serial="S1", model_family="F1", last_sync_counter=1000)
        rule = MaintenanceModelRule(
            model_family="F1",
            component_type="Kit",
            expected_life=10000,
            alert_margin=1000,
            email_recipients="a@b.com",
        )

        self.mock_repo.get_model_rules.return_value = [rule]
        self.mock_repo.get_device_state.return_value = [
            MaintenanceDeviceState(device_serial="S1", component_type="Kit", last_change_counter=0)
        ]
        self.mock_repo.get_last_alert.return_value = None
        self.mock_repo.get_open_incident.return_value = None

        mock_info.return_value = {"device_id": 123}

        # Case 1: OK (Nested structure)
        mock_meters.return_value = [{"meters": [{"name": "Ciclos de trabajo", "value": 5000}]}]
        self.service.process_device(device)
        self.mock_email.send_maintenance_alert.assert_not_called()

        # Case 2: Warning
        mock_meters.return_value = [{"engineCycles": 9500}]  # remaining 500 < 1000
        self.service.process_device(device)
        self.mock_email.send_maintenance_alert.assert_called_once()
        self.mock_repo.create_alert.assert_called_once()

    def test_record_change(self):
        device = MaintenanceDevice(serial="S1", model_family="F1", last_sync_counter=10000)
        self.mock_repo.get_all_devices.return_value = [device]
        self.mock_repo.get_model_rules.return_value = [
            MaintenanceModelRule(model_family="F1", component_type="Kit", expected_life=100)
        ]

        self.service.record_change("S1", "Kit", "INC-1", "Notes")

        self.mock_repo.create_history_record.assert_called()
        self.mock_repo.upsert_device_state.assert_called()
        self.mock_repo.delete_alerts_for_component.assert_called_with("S1", "Kit")

    def test_manual_update_state(self):
        self.service.manual_update_state("S1", "Kit", 5000)
        self.mock_repo.upsert_device_state.assert_called()

    def test_rename_family(self):
        self.service.rename_family("Old", "New")
        self.mock_repo.rename_model_family.assert_called_with("Old", "New")

    def test_sync_single_device(self):
        self.mock_repo.get_all_devices.return_value = [
            MaintenanceDevice(serial="S1", model_family="F1", is_active=True)
        ]
        with patch.object(self.service, "process_device") as mock_proc:
            self.service.sync_single_device("S1")
            mock_proc.assert_called()


if __name__ == "__main__":
    unittest.main()
