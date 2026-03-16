"""Persistence for saved analyses (incidents) for comparison with new logs."""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime
from typing import Any, List
from uuid import UUID

from infrastructure.database import Database


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
    """Repository for saved_analyses table (PostgreSQL/Neon)."""

    def __init__(self, database: Database | None = None) -> None:
        self._db = database or Database()

    def create(
        self,
        name: str,
        incidents: List[dict],
        global_severity: str,
        equipment_identifier: str | None = None,
    ) -> SavedAnalysisSnapshot:
        """Insert a new saved analysis. Returns the created row."""
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

    def get_by_id(self, id: UUID) -> SavedAnalysisSnapshot | None:
        """Return a saved analysis by id, or None if not found."""
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

    def list(self) -> List[SavedAnalysisSnapshot]:
        """Return all saved analyses, newest first."""
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

    def delete(self, id: UUID) -> bool:
        """Delete a saved analysis by id. Returns True if a row was deleted."""
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM saved_analyses WHERE id = %s", (str(id),))
                deleted = cur.rowcount
            conn.commit()
        return deleted > 0

    @staticmethod
    def _row_to_snapshot(row: tuple) -> SavedAnalysisSnapshot:
        incidents = row[3] if isinstance(row[3], list) else json.loads(row[3]) if row[3] else []
        return SavedAnalysisSnapshot(
            id=row[0] if isinstance(row[0], UUID) else UUID(str(row[0])),
            name=row[1],
            equipment_identifier=row[2],
            incidents=incidents,
            global_severity=row[4],
            created_at=row[5],
        )
