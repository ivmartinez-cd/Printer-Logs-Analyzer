"""Tests for TelemetryRepository (DB path + local fallback + mapping)."""

import unittest
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch
from uuid import uuid4

from backend.infrastructure.database import DatabaseUnavailableError
from backend.infrastructure.repositories.telemetry_repository import (
    TelemetryEvent,
    TelemetryRepository,
)


def _event(serial="S1", code="42.01", counter=1000):
    return TelemetryEvent(
        device_serial=serial,
        code=code,
        classification="Fuser",
        severity="ERROR",
        occurrences=2,
        counter=counter,
        event_time=datetime(2026, 6, 16, tzinfo=timezone.utc),
        saved_analysis_id=uuid4(),
    )


class TestTelemetryRepository(unittest.TestCase):
    def setUp(self):
        self.mock_db = MagicMock()
        self.repo = TelemetryRepository(database=self.mock_db)
        self.mock_conn = self.mock_db.connect.return_value.__enter__.return_value
        self.mock_cur = self.mock_conn.cursor.return_value.__enter__.return_value

    def test_add_events_empty_noop(self):
        self.assertEqual(self.repo.add_events([]), 0)
        self.mock_db.connect.assert_not_called()

    def test_add_events_db_bulk_insert(self):
        n = self.repo.add_events([_event(), _event(counter=2000)])
        self.assertEqual(n, 2)
        self.mock_cur.executemany.assert_called_once()
        self.mock_conn.commit.assert_called_once()

    def test_get_events_db_maps_rows(self):
        rid = uuid4()
        self.mock_cur.fetchall.return_value = [
            (rid, "S1", uuid4(), "42.01", "Fuser", "ERROR", 2, 1000, datetime.now()),
        ]
        events = self.repo.get_events_by_serial("S1")
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0].device_serial, "S1")
        self.assertEqual(events[0].id, rid)

    def test_fallback_to_local_on_db_unavailable(self):
        self.mock_db.connect.side_effect = DatabaseUnavailableError("down")
        with patch.object(self.repo, "_add_events_local", return_value=1) as local_add:
            self.repo.add_events([_event()])
            local_add.assert_called_once()
        with patch.object(self.repo, "_get_events_local", return_value=[]) as local_get:
            self.repo.get_events_by_serial("S1")
            local_get.assert_called_once()

    def test_local_roundtrip_sorted(self):
        with patch.object(self.repo, "_load_local", return_value=[]) as _, patch.object(
            self.repo, "_save_local"
        ) as save:
            self.repo._add_events_local([_event()])
            save.assert_called_once()

        stored = [
            {
                "id": str(uuid4()),
                "device_serial": "S1",
                "saved_analysis_id": None,
                "code": "42.01",
                "classification": "Fuser",
                "severity": "ERROR",
                "occurrences": 1,
                "counter": 500,
                "event_time": "2026-06-10T00:00:00+00:00",
            },
            {
                "id": str(uuid4()),
                "device_serial": "S1",
                "saved_analysis_id": None,
                "code": "42.01",
                "classification": "Fuser",
                "severity": "ERROR",
                "occurrences": 1,
                "counter": 100,
                "event_time": "2026-06-01T00:00:00+00:00",
            },
            {"device_serial": "OTHER", "code": "x", "event_time": "2026-06-01T00:00:00+00:00",
             "id": str(uuid4())},
        ]
        with patch.object(self.repo, "_load_local", return_value=stored):
            events = self.repo._get_events_local("S1")
        self.assertEqual(len(events), 2)
        # Sorted by (event_time, counter) ascending.
        self.assertEqual(events[0].counter, 100)
        self.assertEqual(events[1].counter, 500)


if __name__ == "__main__":
    unittest.main()
