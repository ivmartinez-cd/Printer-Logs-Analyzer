"""Persistence for in-app notifications (e.g. async HP cache refresh results).

Mirrors SavedAnalysisRepository: PostgreSQL with an automatic local-JSON
fallback (backend/../data/notifications_local.json) when the DB is unreachable.
"""

from __future__ import annotations

import json
import threading
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
from uuid import UUID, uuid4

from backend.infrastructure.database import Database, DatabaseUnavailableError

_LOCAL_PATH = Path(__file__).parent.parent.parent.parent / "data" / "notifications_local.json"
_local_write_lock = threading.Lock()

_MAX_LOCAL = 200  # cap the JSON fallback so it doesn't grow unbounded


@dataclass
class Notification:
    """One in-app notification."""

    id: UUID
    type: str
    title: str
    message: str
    status: str
    device_serial: Optional[str]
    is_read: bool
    created_at: datetime
    updated_at: datetime


class NotificationRepository:
    """Repository for the notifications table (PostgreSQL), JSON fallback offline."""

    def __init__(self, database: Database | None = None) -> None:
        self._db = database or Database()

    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------

    def create(
        self,
        type: str,
        title: str,
        message: str = "",
        status: str = "in_progress",
        device_serial: Optional[str] = None,
    ) -> Notification:
        try:
            return self._create_db(type, title, message, status, device_serial)
        except DatabaseUnavailableError:
            return self._create_local(type, title, message, status, device_serial)

    def list(self, limit: int = 50) -> List[Notification]:
        try:
            return self._list_db(limit)
        except DatabaseUnavailableError:
            return self._list_local(limit)

    def update_status(
        self, id: UUID, status: str, title: Optional[str] = None, message: Optional[str] = None
    ) -> Optional[Notification]:
        try:
            return self._update_status_db(id, status, title, message)
        except DatabaseUnavailableError:
            return self._update_status_local(id, status, title, message)

    def mark_read(self, id: UUID) -> bool:
        try:
            return self._mark_read_db(id)
        except DatabaseUnavailableError:
            return self._mark_read_local(id)

    def mark_all_read(self) -> int:
        try:
            return self._mark_all_read_db()
        except DatabaseUnavailableError:
            return self._mark_all_read_local()

    def delete(self, id: UUID) -> bool:
        try:
            return self._delete_db(id)
        except DatabaseUnavailableError:
            return self._delete_local(id)

    def delete_read(self) -> int:
        try:
            return self._delete_read_db()
        except DatabaseUnavailableError:
            return self._delete_read_local()

    # ------------------------------------------------------------------
    # Database helpers
    # ------------------------------------------------------------------

    def _create_db(
        self, type: str, title: str, message: str, status: str, device_serial: Optional[str]
    ) -> Notification:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO notifications (type, title, message, status, device_serial)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id, type, title, message, status, device_serial, is_read,
                              created_at, updated_at
                    """,
                    (type, title, message, status, device_serial),
                )
                row = cur.fetchone()
            conn.commit()
        return self._row_to_notification(row)

    def _list_db(self, limit: int) -> List[Notification]:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, type, title, message, status, device_serial, is_read,
                           created_at, updated_at
                    FROM notifications
                    ORDER BY created_at DESC
                    LIMIT %s
                    """,
                    (limit,),
                )
                rows = cur.fetchall()
        return [self._row_to_notification(r) for r in rows]

    def _update_status_db(
        self, id: UUID, status: str, title: Optional[str], message: Optional[str]
    ) -> Optional[Notification]:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE notifications
                    SET status = %s,
                        title = COALESCE(%s, title),
                        message = COALESCE(%s, message),
                        updated_at = now()
                    WHERE id = %s
                    RETURNING id, type, title, message, status, device_serial, is_read,
                              created_at, updated_at
                    """,
                    (status, title, message, str(id)),
                )
                row = cur.fetchone()
            conn.commit()
        return self._row_to_notification(row) if row else None

    def _mark_read_db(self, id: UUID) -> bool:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE notifications SET is_read = TRUE, updated_at = now() WHERE id = %s",
                    (str(id),),
                )
                updated = cur.rowcount
            conn.commit()
        return updated > 0

    def _mark_all_read_db(self) -> int:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE notifications SET is_read = TRUE, updated_at = now() WHERE is_read = FALSE"
                )
                updated = cur.rowcount
            conn.commit()
        return updated

    def _delete_db(self, id: UUID) -> bool:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM notifications WHERE id = %s", (str(id),))
                deleted = cur.rowcount
            conn.commit()
        return deleted > 0

    def _delete_read_db(self) -> int:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM notifications WHERE is_read = TRUE")
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
            json.dump(items[:_MAX_LOCAL], f, ensure_ascii=False, indent=2, default=str)

    def _create_local(
        self, type: str, title: str, message: str, status: str, device_serial: Optional[str]
    ) -> Notification:
        with _local_write_lock:
            items = self._load_local()
            now = datetime.now(timezone.utc)
            new_id = uuid4()
            item = {
                "id": str(new_id),
                "type": type,
                "title": title,
                "message": message,
                "status": status,
                "device_serial": device_serial,
                "is_read": False,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat(),
            }
            items.insert(0, item)
            self._save_local(items)
        return self._dict_to_notification(item)

    def _list_local(self, limit: int) -> List[Notification]:
        items = self._load_local()
        items.sort(key=lambda i: i.get("created_at", ""), reverse=True)
        return [self._dict_to_notification(i) for i in items[:limit]]

    def _update_status_local(
        self, id: UUID, status: str, title: Optional[str], message: Optional[str]
    ) -> Optional[Notification]:
        with _local_write_lock:
            items = self._load_local()
            for item in items:
                if item["id"] == str(id):
                    item["status"] = status
                    if title is not None:
                        item["title"] = title
                    if message is not None:
                        item["message"] = message
                    item["updated_at"] = datetime.now(timezone.utc).isoformat()
                    self._save_local(items)
                    return self._dict_to_notification(item)
        return None

    def _mark_read_local(self, id: UUID) -> bool:
        with _local_write_lock:
            items = self._load_local()
            for item in items:
                if item["id"] == str(id):
                    item["is_read"] = True
                    self._save_local(items)
                    return True
        return False

    def _mark_all_read_local(self) -> int:
        with _local_write_lock:
            items = self._load_local()
            count = 0
            for item in items:
                if not item.get("is_read"):
                    item["is_read"] = True
                    count += 1
            if count:
                self._save_local(items)
        return count

    def _delete_local(self, id: UUID) -> bool:
        with _local_write_lock:
            items = self._load_local()
            new_items = [i for i in items if i["id"] != str(id)]
            if len(new_items) == len(items):
                return False
            self._save_local(new_items)
        return True

    def _delete_read_local(self) -> int:
        with _local_write_lock:
            items = self._load_local()
            new_items = [i for i in items if not i.get("is_read")]
            deleted = len(items) - len(new_items)
            if deleted:
                self._save_local(new_items)
        return deleted

    # ------------------------------------------------------------------
    # Shared helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _row_to_notification(row: tuple) -> Notification:
        return Notification(
            id=row[0] if isinstance(row[0], UUID) else UUID(str(row[0])),
            type=row[1],
            title=row[2],
            message=row[3],
            status=row[4],
            device_serial=row[5],
            is_read=row[6],
            created_at=row[7],
            updated_at=row[8],
        )

    @staticmethod
    def _dict_to_notification(item: dict) -> Notification:
        def _dt(value: str) -> datetime:
            return datetime.fromisoformat(value) if isinstance(value, str) else value

        return Notification(
            id=UUID(item["id"]),
            type=item["type"],
            title=item["title"],
            message=item.get("message", ""),
            status=item.get("status", "in_progress"),
            device_serial=item.get("device_serial"),
            is_read=bool(item.get("is_read", False)),
            created_at=_dt(item["created_at"]),
            updated_at=_dt(item.get("updated_at", item["created_at"])),
        )
