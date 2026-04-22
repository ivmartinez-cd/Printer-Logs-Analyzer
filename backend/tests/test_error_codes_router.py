
import unittest
from unittest.mock import MagicMock, AsyncMock, patch
from fastapi.testclient import TestClient
from backend.interface.api import app
from backend.interface.deps import get_error_code_repo
from backend.interface.auth import authenticate
from backend.infrastructure.repositories.error_code_repository import ErrorCode
from datetime import datetime


class TestErrorCodesRouter(unittest.TestCase):
    def setUp(self):
        self.mock_repo = MagicMock()
        # Override both the repo and authentication
        app.dependency_overrides[get_error_code_repo] = lambda: self.mock_repo
        app.dependency_overrides[authenticate] = lambda: None
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()

    def _make_ec(self, code="E100", severity="Critical"):
        return ErrorCode(
            id="1", code=code, severity=severity,
            description="Desc", solution_url=None, solution_content=None,
            created_at=datetime(2024, 1, 1), updated_at=datetime(2024, 1, 1)
        )

    def test_upsert_error_code(self):
        self.mock_repo.upsert.return_value = self._make_ec()
        payload = {"code": "E100", "severity": "Critical", "description": "Desc"}
        response = self.client.post("/error-codes/upsert", json=payload)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["code"], "E100")

    def test_solution_proxy_not_found(self):
        self.mock_repo.get_by_codes.return_value = {}
        response = self.client.get("/error-codes/E999/solution-proxy")
        self.assertEqual(response.status_code, 404)

    def test_solution_proxy_no_url(self):
        ec = self._make_ec()
        ec.solution_url = None
        self.mock_repo.get_by_codes.return_value = {"E100": ec}
        response = self.client.get("/error-codes/E100/solution-proxy")
        self.assertEqual(response.status_code, 404)

    def test_solution_proxy_with_url(self):
        ec = self._make_ec()
        ec.solution_url = "https://example.com/solution"
        ec.solution_content = "Cached content"
        self.mock_repo.get_by_codes.return_value = {"E100": ec}
        with patch("backend.interface.routers.error_codes.fetch_solution_content", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = "Live content"
            with patch("backend.interface.routers.error_codes.validate_ssrf_url"):
                response = self.client.get("/error-codes/E100/solution-proxy")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["source"], "live")

    def test_solution_proxy_fallback_to_cache(self):
        ec = self._make_ec()
        ec.solution_url = "https://example.com/solution"
        ec.solution_content = "Cached content"
        self.mock_repo.get_by_codes.return_value = {"E100": ec}
        with patch("backend.interface.routers.error_codes.fetch_solution_content", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = None  # fetch fails
            with patch("backend.interface.routers.error_codes.validate_ssrf_url"):
                response = self.client.get("/error-codes/E100/solution-proxy")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["source"], "cache")


if __name__ == "__main__":
    unittest.main()
