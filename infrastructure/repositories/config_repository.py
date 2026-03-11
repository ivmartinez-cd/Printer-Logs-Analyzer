"""Persistence helpers for configuration versions and audit logs."""

from __future__ import annotations

import json
import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Any, List, Optional

from psycopg2 import extras
from psycopg2.extras import Json

from infrastructure.database import Database


@dataclass
class ConfigVersion:
    """Represents a single config version row."""

    id: str
    version_number: int
    config_json: dict
    created_at: datetime
    created_by: str


@dataclass
class AuditRecord:
    """Audit log entry."""

    user: str
    action: str
    version_number: int
    timestamp: datetime


class ConfigRepository:
    """PostgreSQL repository for configuration versions."""

    def __init__(self, db: Optional[Database] = None) -> None:
        self.db = db or Database()

    def get_latest(self) -> Optional[ConfigVersion]:
        query = """
            SELECT id, version_number, config_json, created_at, created_by
            FROM config_versions
            ORDER BY version_number DESC
            LIMIT 1
        """
        with self.db.connect() as conn, conn.cursor(cursor_factory=extras.RealDictCursor) as cur:
            cur.execute(query)
            row = cur.fetchone()
            return self._row_to_version(row) if row else None

    def create_version(self, payload: dict, created_by: str) -> ConfigVersion:
        new_id = str(uuid.uuid4())
        query = """
            INSERT INTO config_versions (id, version_number, config_json, created_at, created_by)
            VALUES (%s, %s, %s, NOW(), %s)
            RETURNING id, version_number, config_json, created_at, created_by
        """
        with self.db.connect() as conn, conn.cursor(cursor_factory=extras.RealDictCursor) as cur:
            next_version = self._next_version_number(cur)
            cur.execute(query, (new_id, next_version, Json(payload), created_by))
            conn.commit()
            row = cur.fetchone()
            if not row:
                raise RuntimeError("Failed to persist configuration version")
            return self._row_to_version(row)

    def fetch_history(self, limit: int = 20) -> List[ConfigVersion]:
        query = """
            SELECT id, version_number, config_json, created_at, created_by
            FROM config_versions
            ORDER BY version_number DESC
            LIMIT %s
        """
        with self.db.connect() as conn, conn.cursor(cursor_factory=extras.RealDictCursor) as cur:
            cur.execute(query, (limit,))
            rows = cur.fetchall() or []
            return [self._row_to_version(row) for row in rows]

    def _next_version_number(self, cur) -> int:
        cur.execute("SELECT COALESCE(MAX(version_number), 0) + 1 AS next FROM config_versions")
        value = cur.fetchone()
        return int(value["next"])

    def _row_to_version(self, row: dict) -> ConfigVersion:
        data = row["config_json"]
        if isinstance(data, str):
            data = json.loads(data)
        return ConfigVersion(
            id=str(row["id"]),
            version_number=int(row["version_number"]),
            config_json=data,
            created_at=row["created_at"],
            created_by=row["created_by"],
        )


class AuditRepository:
    """Audit trail writer."""

    def __init__(self, db: Optional[Database] = None) -> None:
        self.db = db or Database()

    def log(self, record: AuditRecord) -> None:
        query = """
            INSERT INTO audit_log (user, action, version, timestamp)
            VALUES (%s, %s, %s, %s)
        """
        with self.db.connect() as conn, conn.cursor() as cur:
            cur.execute(query, (record.user, record.action, record.version_number, record.timestamp))
            conn.commit()
