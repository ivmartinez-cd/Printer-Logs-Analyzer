import unittest
from datetime import datetime
from unittest.mock import MagicMock, patch
from uuid import uuid4

from backend.infrastructure.repositories.saved_analysis_repository import SavedAnalysisSnapshot
from backend.interface.api import app
from backend.interface.auth import authenticate
from backend.interface.deps import get_saved_analysis_repo, get_telemetry_repo
from fastapi.testclient import TestClient


class TestSavedAnalysisRouter(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.mock_repo = MagicMock()
        self.mock_telemetry_repo = MagicMock()
        app.dependency_overrides[get_saved_analysis_repo] = lambda: self.mock_repo
        app.dependency_overrides[get_telemetry_repo] = lambda: self.mock_telemetry_repo
        app.dependency_overrides[authenticate] = lambda: True

    def tearDown(self):
        app.dependency_overrides.clear()


    def test_list_analyses(self):
        self.mock_repo.list.return_value = [
            SavedAnalysisSnapshot(
                id=uuid4(),
                name="Test",
                equipment_identifier="S1",
                incidents=[],
                global_severity="INFO",
                created_at=datetime.now(),
            )
        ]
        response = self.client.get("/saved-analyses")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)

    def test_get_analysis(self):
        id_val = uuid4()
        self.mock_repo.get_by_id.return_value = SavedAnalysisSnapshot(
            id=id_val,
            name="Test",
            equipment_identifier="S1",
            incidents=[],
            global_severity="INFO",
            created_at=datetime.now(),
        )
        response = self.client.get(f"/saved-analyses/{id_val}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["name"], "Test")

    def test_get_analysis_not_found(self):
        self.mock_repo.get_by_id.return_value = None
        response = self.client.get(f"/saved-analyses/{uuid4()}")
        self.assertEqual(response.status_code, 404)

    def test_create_analysis(self):
        id_val = uuid4()
        self.mock_repo.create.return_value = SavedAnalysisSnapshot(
            id=id_val,
            name="New",
            equipment_identifier="S1",
            incidents=[],
            global_severity="INFO",
            created_at=datetime.now(),
        )
        payload = {
            "name": "New",
            "incidents": [],
            "global_severity": "INFO",
            "equipment_identifier": "S1",
        }
        response = self.client.post("/saved-analyses", json=payload)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], str(id_val))

    def test_delete_analysis(self):
        self.mock_repo.delete.return_value = True
        uid = uuid4()
        response = self.client.delete(f"/saved-analyses/{uid}")
        self.assertEqual(response.status_code, 204)
        self.mock_telemetry_repo.delete_events_by_analysis.assert_called_once_with(uid)

    def test_create_analysis_with_friendly_serial_normalization(self):
        id_val = uuid4()
        self.mock_repo.create.return_value = SavedAnalysisSnapshot(
            id=id_val,
            name="New",
            equipment_identifier="HP LaserJet (BRBSN9YYHQ)",
            incidents=[],
            global_severity="INFO",
            created_at=datetime.now(),
        )
        payload = {
            "name": "New",
            "incidents": [
                {
                    "code": "41.03.02",
                    "classification": "PaperJam",
                    "severity": "ERROR",
                    "occurrences": 1,
                    "start_time": datetime.now().isoformat(),
                    "end_time": datetime.now().isoformat(),
                    "counter_range": [1000, 1100],
                    "sds_link": None,
                    "last_event_time": None,
                }
            ],
            "global_severity": "INFO",
            "equipment_identifier": "HP LaserJet (BRBSN9YYHQ)",
        }
        response = self.client.post("/saved-analyses", json=payload)
        self.assertEqual(response.status_code, 200)
        self.mock_telemetry_repo.add_events.assert_called_once()
        events_passed = self.mock_telemetry_repo.add_events.call_args[0][0]
        self.assertEqual(events_passed[0].device_serial, "BRBSN9YYHQ")



if __name__ == "__main__":
    unittest.main()
