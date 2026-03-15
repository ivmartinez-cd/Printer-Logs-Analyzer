"""Catalog of error codes for enrichment. Persisted in PostgreSQL/Neon."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List

from infrastructure.database import Database


@dataclass
class ErrorCode:
    """Single error code row from the catalog."""

    id: str
    code: str
    severity: str | None
    description: str | None
    solution_url: str | None
    created_at: datetime
    updated_at: datetime


class ErrorCodeRepository:
    """Repository that persists error codes in Neon/PostgreSQL."""

    def __init__(self, database: Database | None = None) -> None:
        self._db = database or Database()

    def get_by_codes(self, codes: List[str]) -> Dict[str, ErrorCode]:
        """Return a map code -> ErrorCode for all given codes that exist in the catalog."""
        if not codes:
            return {}
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, code, severity, description, solution_url, created_at, updated_at
                    FROM error_codes
                    WHERE code = ANY(%s)
                    """,
                    (codes,),
                )
                rows = cur.fetchall()
        return {
            row[1]: ErrorCode(
                id=str(row[0]),
                code=row[1],
                severity=row[2],
                description=row[3],
                solution_url=row[4],
                created_at=row[5],
                updated_at=row[6],
            )
            for row in rows
        }

    def upsert(
        self,
        code: str,
        severity: str | None = None,
        description: str | None = None,
        solution_url: str | None = None,
    ) -> ErrorCode:
        """Insert or update an error code in the database. Returns the saved row."""
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO error_codes (code, severity, description, solution_url)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (code) DO UPDATE SET
                        severity = COALESCE(EXCLUDED.severity, error_codes.severity),
                        description = COALESCE(NULLIF(EXCLUDED.description, ''), error_codes.description),
                        solution_url = COALESCE(NULLIF(EXCLUDED.solution_url, ''), error_codes.solution_url),
                        updated_at = NOW()
                    RETURNING id, code, severity, description, solution_url, created_at, updated_at
                    """,
                    (code, severity or None, description or None, solution_url or None),
                )
                row = cur.fetchone()
            conn.commit()
        return ErrorCode(
            id=str(row[0]),
            code=row[1],
            severity=row[2],
            description=row[3],
            solution_url=row[4],
            created_at=row[5],
            updated_at=row[6],
        )
