
import unittest
from unittest.mock import MagicMock, patch, mock_open
from datetime import datetime
from backend.infrastructure.repositories.error_code_repository import ErrorCodeRepository, ErrorCode
from backend.infrastructure.database import DatabaseUnavailableError
import json

class TestErrorCodeRepository(unittest.TestCase):
    def setUp(self):
        self.mock_db = MagicMock()
        self.repo = ErrorCodeRepository(database=self.mock_db)
        self.mock_conn = self.mock_db.connect.return_value.__enter__.return_value
        self.mock_cur = self.mock_conn.cursor.return_value.__enter__.return_value

    def test_get_by_codes_empty(self):
        self.assertEqual(self.repo.get_by_codes([]), {})

    def test_get_by_codes_db_success(self):
        self.mock_cur.fetchall.return_value = [
            (1, "E100", "Critical", "Desc", "url", "content", datetime.now(), datetime.now())
        ]
        res = self.repo.get_by_codes(["E100"])
        self.assertIn("E100", res)
        self.assertEqual(res["E100"].severity, "Critical")

    def test_get_by_codes_fallback(self):
        self.mock_db.connect.side_effect = DatabaseUnavailableError("Down")
        with patch.object(self.repo, "_load_fallback") as mock_load:
            mock_load.return_value = {
                "E200": ErrorCode(id="2", code="E200", severity="Warning", description=None, solution_url=None, solution_content=None, created_at=datetime.now(), updated_at=datetime.now())
            }
            res = self.repo.get_by_codes(["E200", "E999"])
            self.assertIn("E200", res)
            self.assertNotIn("E999", res)

    def test_upsert_db_success(self):
        self.mock_cur.fetchone.return_value = (1, "E100", "Critical", "Desc", "url", "content", datetime.now(), datetime.now())
        res = self.repo.upsert("E100", severity="Critical")
        self.assertEqual(res.code, "E100")
        self.mock_conn.commit.assert_called()

    def test_upsert_fallback(self):
        self.mock_db.connect.side_effect = DatabaseUnavailableError("Down")
        with patch.object(self.repo, "_upsert_local") as mock_local:
            mock_local.return_value = ErrorCode(id="1", code="E100", severity="Crit", description=None, solution_url=None, solution_content=None, created_at=datetime.now(), updated_at=datetime.now())
            res = self.repo.upsert("E100", severity="Crit")
            self.assertEqual(res.code, "E100")

    def test_load_fallback_success(self):
        mock_data = '[{"id": "1", "code": "E100", "severity": "Warning"}]'
        with patch("backend.infrastructure.repositories.error_code_repository.open", mock_open(read_data=mock_data)):
            with patch("backend.infrastructure.repositories.error_code_repository.Path.exists", return_value=True):
                catalog = self.repo._load_fallback()
                self.assertIn("E100", catalog)
                self.assertEqual(catalog["E100"].severity, "Warning")

    def test_load_fallback_bad_json(self):
        with patch("backend.infrastructure.repositories.error_code_repository.open", mock_open(read_data="bad json")):
            with patch("backend.infrastructure.repositories.error_code_repository.Path.exists", return_value=True):
                catalog = self.repo._load_fallback()
                self.assertEqual(catalog, {})

    @patch("backend.infrastructure.repositories.error_code_repository.open", new_callable=mock_open, read_data='[{"id": "1", "code": "E100", "severity": "Info"}]')
    @patch("backend.infrastructure.repositories.error_code_repository.Path.exists", return_value=True)
    def test_upsert_local_locked_existing(self, mock_exists, m_open):
        res = self.repo._upsert_local_locked("E100", severity="Critical", description="New desc", solution_url=None, solution_content=None)
        self.assertEqual(res.severity, "Critical")
        self.assertEqual(res.description, "New desc")
        self.assertIsNone(self.repo._fallback_cache) # cache invalidated

    @patch("backend.infrastructure.repositories.error_code_repository.open", new_callable=mock_open, read_data='[{"id": "1", "code": "E100", "severity": "Info"}]')
    @patch("backend.infrastructure.repositories.error_code_repository.Path.exists", return_value=True)
    def test_upsert_local_locked_new(self, mock_exists, m_open):
        res = self.repo._upsert_local_locked("E200", severity="Warning", description=None, solution_url=None, solution_content=None)
        self.assertEqual(res.id, "2")
        self.assertEqual(res.code, "E200")

if __name__ == "__main__":
    unittest.main()
