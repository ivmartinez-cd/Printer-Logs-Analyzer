
import unittest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from uuid import uuid4
from datetime import datetime
from backend.interface.api import app
from backend.interface.deps import get_saved_analysis_repo
from backend.infrastructure.repositories.saved_analysis_repository import SavedAnalysisSnapshot
from backend.interface.auth import authenticate

class TestSavedAnalysisRouter(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.mock_repo = MagicMock()
        app.dependency_overrides[get_saved_analysis_repo] = lambda: self.mock_repo
        app.dependency_overrides[authenticate] = lambda: True

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_list_analyses(self):
        self.mock_repo.list.return_value = [
            SavedAnalysisSnapshot(id=uuid4(), name="Test", equipment_identifier="S1", incidents=[], global_severity="INFO", created_at=datetime.now())
        ]
        response = self.client.get("/saved-analyses")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)

    def test_get_analysis(self):
        id_val = uuid4()
        self.mock_repo.get_by_id.return_value = SavedAnalysisSnapshot(
            id=id_val, name="Test", equipment_identifier="S1", incidents=[], global_severity="INFO", created_at=datetime.now()
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
            id=id_val, name="New", equipment_identifier="S1", incidents=[], global_severity="INFO", created_at=datetime.now()
        )
        payload = {
            "name": "New",
            "incidents": [],
            "global_severity": "INFO",
            "equipment_identifier": "S1"
        }
        response = self.client.post("/saved-analyses", json=payload)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], str(id_val))

    def test_delete_analysis(self):
        self.mock_repo.delete.return_value = True
        response = self.client.delete(f"/saved-analyses/{uuid4()}")
        self.assertEqual(response.status_code, 204)

if __name__ == "__main__":
    unittest.main()
