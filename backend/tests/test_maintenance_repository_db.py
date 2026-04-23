import unittest
from datetime import datetime
from unittest.mock import MagicMock, patch

from backend.domain.entities import (
    MaintenanceAlert,
    MaintenanceDevice,
    MaintenanceDeviceState,
    MaintenanceHistory,
    MaintenanceModelRule,
)
from backend.infrastructure.repositories.maintenance_repository import MaintenanceRepository


class TestMaintenanceRepositoryDB(unittest.TestCase):
    def setUp(self):
        self.mock_db = MagicMock()
        self.repo = MaintenanceRepository(database=self.mock_db)

        # Setup common mock chain
        self.mock_conn = self.mock_db.connect.return_value.__enter__.return_value
        self.mock_cur = self.mock_conn.cursor.return_value.__enter__.return_value

    def test_get_all_devices_db(self):
        self.mock_cur.fetchall.return_value = [
            ("SER123", "FamilyX", 100, datetime(2023, 1, 1), True)
        ]

        devices = self.repo._get_all_devices_db()

        self.assertEqual(len(devices), 1)
        self.assertEqual(devices[0].serial, "SER123")
        self.mock_cur.execute.assert_called()

    def test_upsert_device_db(self):
        device = MaintenanceDevice(serial="SER123", model_family="FamilyX")
        self.repo._upsert_device_db(device)
        self.mock_conn.commit.assert_called_once()
        self.mock_cur.execute.assert_called()

    def test_get_model_rules_db(self):
        self.mock_cur.fetchall.return_value = [
            (1, "FamilyX", "Fuser", 100000, 5000, "test@test.com")
        ]
        rules = self.repo._get_model_rules_db("FamilyX")
        self.assertEqual(len(rules), 1)
        self.assertEqual(rules[0].component_type, "Fuser")

    def test_upsert_model_rule_db(self):
        rule = MaintenanceModelRule(model_family="F1", component_type="C1", expected_life=100)
        self.repo._upsert_model_rule_db(rule)
        self.mock_conn.commit.assert_called_once()

    def test_get_all_model_families_db(self):
        self.mock_cur.fetchall.return_value = [("FamA",), ("FamB",)]
        families = self.repo._get_all_model_families_db()
        self.assertEqual(families, ["FamA", "FamB"])

    def test_get_device_state_db(self):
        self.mock_cur.fetchall.return_value = [(1, "SER1", "Comp1", 500)]
        states = self.repo._get_device_state_db("SER1")
        self.assertEqual(len(states), 1)
        self.assertEqual(states[0].last_change_counter, 500)

    def test_upsert_device_state_db(self):
        state = MaintenanceDeviceState(
            device_serial="S", component_type="C", last_change_counter=10
        )
        self.repo._upsert_device_state_db(state)
        self.mock_conn.commit.assert_called_once()

    def test_get_last_alert_db(self):
        # Found case
        self.mock_cur.fetchone.return_value = (1, "S1", "C1", datetime.now(), 500, "active")
        alert = self.repo._get_last_alert_db("S1", "C1")
        self.assertIsNotNone(alert)

        # Not found case
        self.mock_cur.fetchone.return_value = None
        alert = self.repo._get_last_alert_db("S1", "C1")
        self.assertIsNone(alert)

    def test_create_alert_db(self):
        alert = MaintenanceAlert(
            device_serial="S", component_type="C", triggered_at=datetime.now(), counter_at_alert=100
        )
        self.repo._create_alert_db(alert)
        self.mock_conn.commit.assert_called_once()

    def test_delete_alerts_db(self):
        self.repo._delete_alerts_db("S", "C")
        self.mock_cur.execute.assert_called()
        self.mock_conn.commit.assert_called_once()

    def test_get_history_db(self):
        self.mock_cur.fetchall.return_value = [
            (1, "S1", "C1", 100, "INC-1", "Notes", datetime.now())
        ]
        history = self.repo._get_history_db("S1")
        self.assertEqual(len(history), 1)
        self.assertEqual(history[0].incident_number, "INC-1")

    def test_create_history_record_db(self):
        record = MaintenanceHistory(
            device_serial="S", component_type="C", change_counter=10, changed_at=datetime.now()
        )
        self.repo._create_history_record_db(record)
        self.mock_conn.commit.assert_called_once()

    def test_rename_model_family_db(self):
        self.repo._rename_model_family_db("Old", "New")
        self.assertEqual(self.mock_cur.execute.call_count, 2)
        self.mock_conn.commit.assert_called_once()

    def test_delete_devices_by_family_db(self):
        self.repo._delete_devices_by_family_db("Fam")
        self.mock_cur.execute.assert_called()
        self.mock_conn.commit.assert_called_once()

    def test_local_fallbacks_empty(self):
        # Coverage for local_func lambdas and methods returning empty
        self.assertEqual(self.repo._get_all_devices_local(), [])


if __name__ == "__main__":
    unittest.main()
