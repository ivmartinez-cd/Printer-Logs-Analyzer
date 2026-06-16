"""Persistence for the structured per-device telemetry history.

Each saved analysis fans out its incidents into individual telemetry rows so the
device health (degradation) engine can query the temporal evolution of a serial.

When the database is unreachable it falls back to a local JSON file
(backend/data/telemetry_events_local.json), mirroring SavedAnalysisRepository.
"""

from __future__ import annotations

import json
import threading
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import List
from uuid import UUID, uuid4

from backend.infrastructure.database import Database, DatabaseUnavailableError

_LOCAL_PATH = Path(__file__).parent.parent.parent.parent / "data" / "telemetry_events_local.json"

# Serializes concurrent writes to the local JSON fallback file.
_local_write_lock = threading.Lock()


@dataclass
class TelemetryEvent:
    """One telemetry datapoint for a device's history."""

    device_serial: str
    code: str
    classification: str | None
    severity: str
    occurrences: int
    counter: int
    event_time: datetime
    saved_analysis_id: UUID | None = None
    id: UUID | None = None


class TelemetryRepository:
    """Repository for device_telemetry_events (PostgreSQL/Neon).

    Falls back to a local JSON file when the database is unreachable.
    """

    def __init__(self, database: Database | None = None) -> None:
        self._db = database or Database()

    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------

    def add_events(self, events: List[TelemetryEvent]) -> int:
        """Bulk-insert telemetry events. Returns the number inserted."""
        if not events:
            return 0
        try:
            return self._add_events_db(events)
        except DatabaseUnavailableError:
            return self._add_events_local(events)

    def get_events_by_serial(self, device_serial: str) -> List[TelemetryEvent]:
        """Return all events for a serial ordered by (event_time, counter) asc."""
        try:
            return self._get_events_db(device_serial)
        except DatabaseUnavailableError:
            return self._get_events_local(device_serial)

    def delete_events_by_analysis(self, saved_analysis_id: UUID) -> int:
        """Delete telemetry events associated with a specific saved analysis ID."""
        try:
            return self._delete_events_db(saved_analysis_id)
        except DatabaseUnavailableError:
            return self._delete_events_local(saved_analysis_id)

    # ------------------------------------------------------------------
    # Database helpers
    # ------------------------------------------------------------------

    def _add_events_db(self, events: List[TelemetryEvent]) -> int:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.executemany(
                    """
                    INSERT INTO device_telemetry_events
                        (device_serial, saved_analysis_id, code, classification,
                         severity, occurrences, counter, event_time)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    [
                        (
                            e.device_serial,
                            str(e.saved_analysis_id) if e.saved_analysis_id else None,
                            e.code,
                            e.classification,
                            e.severity,
                            e.occurrences,
                            e.counter,
                            e.event_time,
                        )
                        for e in events
                    ],
                )
            conn.commit()
        return len(events)

    def _get_events_db(self, device_serial: str) -> List[TelemetryEvent]:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, device_serial, saved_analysis_id, code, classification,
                           severity, occurrences, counter, event_time
                    FROM device_telemetry_events
                    WHERE device_serial = %s
                    ORDER BY event_time ASC, counter ASC
                    """,
                    (device_serial,),
                )
                rows = cur.fetchall()
        return [self._row_to_event(r) for r in rows]

    def _delete_events_db(self, saved_analysis_id: UUID) -> int:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM device_telemetry_events WHERE saved_analysis_id = %s",
                    (str(saved_analysis_id),),
                )
                deleted = cur.rowcount
            conn.commit()
        return deleted

    # ------------------------------------------------------------------
    # Local JSON fallback helpers
    # ------------------------------------------------------------------

    def _load_local(self) -> list:
        if not _LOCAL_PATH.exists():
            return []
        with open(_LOCAL_PATH, encoding="utf-8") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return []

    def _save_local(self, items: list) -> None:
        _LOCAL_PATH.parent.mkdir(exist_ok=True)
        with open(_LOCAL_PATH, "w", encoding="utf-8") as f:
            json.dump(items, f, ensure_ascii=False, indent=2, default=str)

    def _add_events_local(self, events: List[TelemetryEvent]) -> int:
        with _local_write_lock:
            items = self._load_local()
            for e in events:
                items.append(
                    {
                        "id": str(e.id or uuid4()),
                        "device_serial": e.device_serial,
                        "saved_analysis_id": str(e.saved_analysis_id)
                        if e.saved_analysis_id
                        else None,
                        "code": e.code,
                        "classification": e.classification,
                        "severity": e.severity,
                        "occurrences": e.occurrences,
                        "counter": e.counter,
                        "event_time": e.event_time.isoformat(),
                    }
                )
            self._save_local(items)
        return len(events)

    def _get_events_local(self, device_serial: str) -> List[TelemetryEvent]:
        items = [i for i in self._load_local() if i.get("device_serial") == device_serial]
        events = [self._dict_to_event(i) for i in items]
        events.sort(key=lambda e: (e.event_time, e.counter))
        return events

    def _delete_events_local(self, saved_analysis_id: UUID) -> int:
        with _local_write_lock:
            items = self._load_local()
            target_id_str = str(saved_analysis_id)
            filtered = [i for i in items if i.get("saved_analysis_id") != target_id_str]
            deleted = len(items) - len(filtered)
            self._save_local(filtered)
        return deleted


    # ------------------------------------------------------------------
    # Shared helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _row_to_event(row: tuple) -> TelemetryEvent:
        return TelemetryEvent(
            id=row[0] if isinstance(row[0], UUID) else UUID(str(row[0])),
            device_serial=row[1],
            saved_analysis_id=row[2]
            if row[2] is None or isinstance(row[2], UUID)
            else UUID(str(row[2])),
            code=row[3],
            classification=row[4],
            severity=row[5],
            occurrences=row[6],
            counter=row[7],
            event_time=row[8],
        )

    @staticmethod
    def _dict_to_event(item: dict) -> TelemetryEvent:
        event_time = item["event_time"]
        if isinstance(event_time, str):
            event_time = datetime.fromisoformat(event_time)
        saved_id = item.get("saved_analysis_id")
        return TelemetryEvent(
            id=UUID(item["id"]) if item.get("id") else None,
            device_serial=item["device_serial"],
            saved_analysis_id=UUID(saved_id) if saved_id else None,
            code=item["code"],
            classification=item.get("classification"),
            severity=item.get("severity", "INFO"),
            occurrences=item.get("occurrences", 1),
            counter=item.get("counter", 0),
            event_time=event_time,
        )

    @staticmethod
    def _normalize_dt(dt: datetime) -> datetime:
        return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt
