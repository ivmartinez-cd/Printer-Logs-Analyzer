import unittest
from datetime import datetime, timezone
from unittest.mock import MagicMock
from uuid import uuid4

from backend.infrastructure.repositories.notification_repository import Notification
from backend.interface.api import app
from backend.interface.auth import authenticate
from backend.interface.deps import get_notification_repo
from fastapi.testclient import TestClient


def _notif(is_read: bool = False) -> Notification:
    now = datetime.now(timezone.utc)
    return Notification(
        id=uuid4(),
        type="hp_cache_refresh",
        title="Caché de HP — S1",
        message="Procesando…",
        status="in_progress",
        device_serial="S1",
        is_read=is_read,
        created_at=now,
        updated_at=now,
    )


class TestNotificationsRouter(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.mock_repo = MagicMock()
        app.dependency_overrides[get_notification_repo] = lambda: self.mock_repo
        app.dependency_overrides[authenticate] = lambda: True

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_list_returns_items_and_unread_count(self):
        self.mock_repo.list.return_value = [_notif(is_read=False), _notif(is_read=True)]
        response = self.client.get("/notifications")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["notifications"]), 2)
        self.assertEqual(data["unread_count"], 1)

    def test_mark_read_ok(self):
        self.mock_repo.mark_read.return_value = True
        response = self.client.post(f"/notifications/{uuid4()}/read")
        self.assertEqual(response.status_code, 204)

    def test_mark_read_not_found(self):
        self.mock_repo.mark_read.return_value = False
        response = self.client.post(f"/notifications/{uuid4()}/read")
        self.assertEqual(response.status_code, 404)

    def test_mark_read_invalid_id(self):
        response = self.client.post("/notifications/not-a-uuid/read")
        self.assertEqual(response.status_code, 400)

    def test_mark_all_read(self):
        self.mock_repo.mark_all_read.return_value = 3
        response = self.client.post("/notifications/read-all")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["updated"], 3)
