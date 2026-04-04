"""Persistence for saved analyses (incidents) for comparison with new logs.

When the database is unreachable the repository automatically falls back to a
local JSON file (backend/data/saved_analyses_local.json) so snapshots can
still be saved and compared behind a corporate firewall.
"""

from __future__ import annotations

import json
import threading
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, List
from uuid import UUID, uuid4

from backend.infrastructure.database import Database, DatabaseUnavailableError

_LOCAL_PATH = Path(__file__).parent.parent.parent / "data" / "saved_analyses_local.json"

# Serializes concurrent writes to the local JSON fallback file.
_local_write_lock = threading.Lock()


@dataclass
class SavedAnalysisSnapshot:
    """One saved analysis (incident) for later comparison."""

    id: UUID
    name: str
    equipment_identifier: str | None
    incidents: List[dict]
    global_severity: str
    created_at: datetime


class SavedAnalysisRepository:
    """Repository for saved_analyses table (PostgreSQL/Neon).

    Falls back to a local JSON file when the database is unreachable.
    """

    def __init__(self, database: Database | None = None) -> None:
        self._db = database or Database()

    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------

    def create(
        self,
        name: str,
        incidents: List[dict],
        global_severity: str,
        equipment_identifier: str | None = None,
    ) -> SavedAnalysisSnapshot:
        try:
            return self._create_db(name, incidents, global_severity, equipment_identifier)
        except DatabaseUnavailableError:
            return self._create_local(name, incidents, global_severity, equipment_identifier)

    def get_by_id(self, id: UUID) -> SavedAnalysisSnapshot | None:
        try:
            return self._get_by_id_db(id)
        except DatabaseUnavailableError:
            return self._get_by_id_local(id)

    def list(self) -> List[SavedAnalysisSnapshot]:
        try:
            return self._list_db()
        except DatabaseUnavailableError:
            return self._list_local()

    def delete(self, id: UUID) -> bool:
        try:
            return self._delete_db(id)
        except DatabaseUnavailableError:
            return self._delete_local(id)

    # ------------------------------------------------------------------
    # Database helpers
    # ------------------------------------------------------------------

    def _create_db(
        self,
        name: str,
        incidents: List[dict],
        global_severity: str,
        equipment_identifier: str | None,
    ) -> SavedAnalysisSnapshot:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO saved_analyses (name, equipment_identifier, incidents, global_severity)
                    VALUES (%s, %s, %s::jsonb, %s)
                    RETURNING id, name, equipment_identifier, incidents, global_severity, created_at
                    """,
                    (name, equipment_identifier, json.dumps(incidents), global_severity),
                )
                row = cur.fetchone()
            conn.commit()
        return self._row_to_snapshot(row)

    def _get_by_id_db(self, id: UUID) -> SavedAnalysisSnapshot | None:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, name, equipment_identifier, incidents, global_severity, created_at
                    FROM saved_analyses
                    WHERE id = %s
                    """,
                    (str(id),),
                )
                row = cur.fetchone()
        return self._row_to_snapshot(row) if row else None

    def _list_db(self) -> List[SavedAnalysisSnapshot]:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, name, equipment_identifier, incidents, global_severity, created_at
                    FROM saved_analyses
                    ORDER BY created_at DESC
                    """
                )
                rows = cur.fetchall()
        return [self._row_to_snapshot(r) for r in rows]

    def _delete_db(self, id: UUID) -> bool:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM saved_analyses WHERE id = %s", (str(id),))
                deleted = cur.rowcount
            conn.commit()
        return deleted > 0

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

    def _create_local(
        self,
        name: str,
        incidents: List[dict],
        global_severity: str,
        equipment_identifier: str | None,
    ) -> SavedAnalysisSnapshot:
        with _local_write_lock:
            items = self._load_local()
            now = datetime.now(timezone.utc)
            new_id = uuid4()
            item = {
                "id": str(new_id),
                "name": name,
                "equipment_identifier": equipment_identifier,
                "incidents": incidents,
                "global_severity": global_severity,
                "created_at": now.isoformat(),
            }
            items.insert(0, item)
            self._save_local(items)
        return SavedAnalysisSnapshot(
            id=new_id,
            name=name,
            equipment_identifier=equipment_identifier,
            incidents=incidents,
            global_severity=global_severity,
            created_at=now,
        )

    def _get_by_id_local(self, id: UUID) -> SavedAnalysisSnapshot | None:
        items = self._load_local()
        for item in items:
            if item["id"] == str(id):
                return self._dict_to_snapshot(item)
        return None

    def _list_local(self) -> List[SavedAnalysisSnapshot]:
        items = self._load_local()
        return [self._dict_to_snapshot(i) for i in items]

    def _delete_local(self, id: UUID) -> bool:
        with _local_write_lock:
            items = self._load_local()
            filtered = [i for i in items if i["id"] != str(id)]
            if len(filtered) == len(items):
                return False
            self._save_local(filtered)
        return True

    # ------------------------------------------------------------------
    # Shared helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _row_to_snapshot(row: tuple) -> SavedAnalysisSnapshot:
        incidents = row[3] if row[3] is not None else []
        return SavedAnalysisSnapshot(
            id=row[0] if isinstance(row[0], UUID) else UUID(str(row[0])),
            name=row[1],
            equipment_identifier=row[2],
            incidents=incidents,
            global_severity=row[4],
            created_at=row[5],
        )

    @staticmethod
    def _dict_to_snapshot(item: dict) -> SavedAnalysisSnapshot:
        created_at = item["created_at"]
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        return SavedAnalysisSnapshot(
            id=UUID(item["id"]),
            name=item["name"],
            equipment_identifier=item.get("equipment_identifier"),
            incidents=item.get("incidents", []),
            global_severity=item.get("global_severity", "INFO"),
            created_at=created_at,
        )
