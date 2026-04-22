
import unittest
from unittest.mock import MagicMock, patch
from datetime import datetime
from uuid import uuid4
from backend.infrastructure.repositories.saved_analysis_repository import SavedAnalysisRepository, SavedAnalysisSnapshot

class TestSavedAnalysisRepository(unittest.TestCase):
    def setUp(self):
        self.mock_db = MagicMock()
        self.repo = SavedAnalysisRepository(database=self.mock_db)
        self.mock_conn = self.mock_db.connect.return_value.__enter__.return_value
        self.mock_cur = self.mock_conn.cursor.return_value.__enter__.return_value

    def test_create_db(self):
        self.mock_cur.fetchone.return_value = (uuid4(), "Test", "S1", [], "INFO", datetime.now(), None)
        snapshot = self.repo._create_db("Test", [], "INFO", "S1")
        self.assertIsInstance(snapshot, SavedAnalysisSnapshot)
        self.mock_conn.commit.assert_called()

    def test_get_by_id_db(self):
        id_val = uuid4()
        self.mock_cur.fetchone.return_value = (id_val, "Test", "S1", [], "INFO", datetime.now(), None)
        snapshot = self.repo._get_by_id_db(id_val)
        self.assertIsNotNone(snapshot)
        self.assertEqual(snapshot.id, id_val)

    def test_list_db(self):
        self.mock_cur.fetchall.return_value = [
            (uuid4(), "Test1", "S1", [], "INFO", datetime.now(), None),
            (uuid4(), "Test2", "S2", [], "INFO", datetime.now(), None)
        ]
        results = self.repo._list_db()
        self.assertEqual(len(results), 2)

    def test_delete_db(self):
        self.mock_cur.rowcount = 1
        result = self.repo._delete_db(uuid4())
        self.assertTrue(result)
        self.mock_conn.commit.assert_called()

    def test_local_fallbacks(self):
        # We can't easily test local file system without mocks, but we can test the call flow
        with patch.object(self.repo, "_load_local") as mock_load:
            mock_load.return_value = []
            with patch.object(self.repo, "_save_local") as mock_save:
                snapshot = self.repo._create_local("Test", [], "INFO", "S1")
                self.assertIsInstance(snapshot, SavedAnalysisSnapshot)
                mock_save.assert_called()

    def test_get_by_id_local(self):
        id_val = uuid4()
        with patch.object(self.repo, "_load_local") as mock_load:
            mock_load.return_value = [{
                "id": str(id_val),
                "name": "Test",
                "created_at": datetime.now().isoformat()
            }]
            snapshot = self.repo._get_by_id_local(id_val)
            self.assertIsNotNone(snapshot)
            self.assertEqual(snapshot.id, id_val)

    def test_public_interface_db_success(self):
        # Test create() when DB works
        self.mock_cur.fetchone.return_value = (uuid4(), "Test", "S1", [], "INFO", datetime.now(), None)
        snapshot = self.repo.create("Test", [], "INFO", "S1")
        self.assertIsNotNone(snapshot)
        self.mock_conn.commit.assert_called()

    def test_public_interface_fallback(self):
        # Force DatabaseUnavailableError
        self.mock_db.connect.side_effect = Exception("DB Down") # In BaseRepository this is wrapped
        # Wait, BaseRepository catches DatabaseUnavailableError. 
        # But SavedAnalysisRepository has its own try/except DatabaseUnavailableError
        
        from backend.infrastructure.database import DatabaseUnavailableError
        self.mock_db.connect.side_effect = DatabaseUnavailableError("Down")
        
        with patch.object(self.repo, "_create_local") as mock_create_local:
            self.repo.create("Test", [], "INFO", "S1")
            mock_create_local.assert_called()
            
        with patch.object(self.repo, "_list_local") as mock_list_local:
            self.repo.list()
            mock_list_local.assert_called()

        with patch.object(self.repo, "_delete_local") as mock_delete_local:
            self.repo.delete(uuid4())
            mock_delete_local.assert_called()

    def test_row_to_snapshot_edge_cases(self):
        # Test with None incidents
        row = (uuid4(), "Name", "S1", None, "INFO", datetime.now(), "Diag")
        snapshot = self.repo._row_to_snapshot(row)
        self.assertEqual(snapshot.incidents, [])
        self.assertEqual(snapshot.ai_diagnosis, "Diag")

if __name__ == "__main__":
    unittest.main()
