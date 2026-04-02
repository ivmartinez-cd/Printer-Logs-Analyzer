"""Catalog of error codes for enrichment. Persisted in PostgreSQL/Neon.

When the database is unreachable the repository automatically falls back to a
local JSON file so the application keeps working behind a corporate firewall.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

from infrastructure.database import Database, DatabaseUnavailableError

# Paths are relative to this file's location:
#   backend/infrastructure/repositories/error_code_repository.py
#   → backend/infrastructure/fallback/error_codes_seed.json  (bundled, read-only)
#   → backend/data/error_codes_local.json                    (runtime writable copy)
_FALLBACK_DIR = Path(__file__).parent.parent / "fallback"
_SEED_PATH = _FALLBACK_DIR / "error_codes_seed.json"
_LOCAL_PATH = Path(__file__).parent.parent.parent / "data" / "error_codes_local.json"

_EPOCH = datetime(2000, 1, 1, tzinfo=timezone.utc)


@dataclass
class ErrorCode:
    """Single error code row from the catalog."""

    id: str
    code: str
    severity: str | None
    description: str | None
    solution_url: str | None
    solution_content: str | None
    created_at: datetime
    updated_at: datetime


class ErrorCodeRepository:
    """Repository that persists error codes in Neon/PostgreSQL.

    On any database connectivity failure the repository transparently falls
    back to a local JSON file so parsing and analysis continue to work.
    """

    def __init__(self, database: Database | None = None) -> None:
        self._db = database or Database()
        # In-memory cache for the fallback dataset (invalidated on upsert).
        self._fallback_cache: Optional[Dict[str, ErrorCode]] = None

    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------

    def get_by_codes(self, codes: List[str]) -> Dict[str, ErrorCode]:
        """Return a map code -> ErrorCode for all given codes that exist in the catalog."""
        if not codes:
            return {}
        try:
            return self._get_by_codes_db(codes)
        except DatabaseUnavailableError:
            catalog = self._load_fallback()
            return {c: catalog[c] for c in codes if c in catalog}

    def upsert(
        self,
        code: str,
        severity: str | None = None,
        description: str | None = None,
        solution_url: str | None = None,
        solution_content: str | None = None,
    ) -> ErrorCode:
        """Insert or update an error code. Falls back to local JSON when DB is down."""
        try:
            return self._upsert_db(code, severity, description, solution_url, solution_content)
        except DatabaseUnavailableError:
            return self._upsert_local(code, severity, description, solution_url, solution_content)

    # ------------------------------------------------------------------
    # Database helpers
    # ------------------------------------------------------------------

    def _get_by_codes_db(self, codes: List[str]) -> Dict[str, ErrorCode]:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, code, severity, description, solution_url, solution_content, created_at, updated_at
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
                solution_content=row[5],
                created_at=row[6],
                updated_at=row[7],
            )
            for row in rows
        }

    def _upsert_db(
        self,
        code: str,
        severity: str | None,
        description: str | None,
        solution_url: str | None,
        solution_content: str | None,
    ) -> ErrorCode:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO error_codes (code, severity, description, solution_url, solution_content)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (code) DO UPDATE SET
                        severity = COALESCE(EXCLUDED.severity, error_codes.severity),
                        description = COALESCE(NULLIF(EXCLUDED.description, ''), error_codes.description),
                        solution_url = COALESCE(NULLIF(EXCLUDED.solution_url, ''), error_codes.solution_url),
                        solution_content = COALESCE(EXCLUDED.solution_content, error_codes.solution_content),
                        updated_at = NOW()
                    RETURNING id, code, severity, description, solution_url, solution_content, created_at, updated_at
                    """,
                    (code, severity or None, description or None, solution_url or None, solution_content or None),
                )
                row = cur.fetchone()
            conn.commit()
        return ErrorCode(
            id=str(row[0]),
            code=row[1],
            severity=row[2],
            description=row[3],
            solution_url=row[4],
            solution_content=row[5],
            created_at=row[6],
            updated_at=row[7],
        )

    # ------------------------------------------------------------------
    # Local JSON fallback helpers
    # ------------------------------------------------------------------

    def _load_fallback(self) -> Dict[str, ErrorCode]:
        """Load (and cache) the local error codes catalog."""
        if self._fallback_cache is None:
            path = _LOCAL_PATH if _LOCAL_PATH.exists() else _SEED_PATH
            with open(path, encoding="utf-8") as f:
                items = json.load(f)
            self._fallback_cache = {
                item["code"]: ErrorCode(
                    id=str(item["id"]),
                    code=item["code"],
                    severity=item.get("severity"),
                    description=item.get("description"),
                    solution_url=item.get("solution_url"),
                    solution_content=item.get("solution_content"),
                    created_at=_EPOCH,
                    updated_at=_EPOCH,
                )
                for item in items
            }
        return self._fallback_cache

    def _upsert_local(
        self,
        code: str,
        severity: str | None,
        description: str | None,
        solution_url: str | None,
        solution_content: str | None,
    ) -> ErrorCode:
        """Insert or update an error code in the local JSON file."""
        source = _LOCAL_PATH if _LOCAL_PATH.exists() else _SEED_PATH
        with open(source, encoding="utf-8") as f:
            items: list = json.load(f)

        existing = next((i for i in items if i["code"] == code), None)
        now = datetime.now(timezone.utc)

        if existing:
            if severity is not None:
                existing["severity"] = severity
            if description:
                existing["description"] = description
            if solution_url:
                existing["solution_url"] = solution_url
            if solution_content:
                existing["solution_content"] = solution_content
            item_data = existing
        else:
            max_id = max((int(i["id"]) for i in items), default=0)
            item_data = {
                "id": str(max_id + 1),
                "code": code,
                "severity": severity,
                "description": description,
                "solution_url": solution_url,
                "solution_content": solution_content,
            }
            items.append(item_data)

        _LOCAL_PATH.parent.mkdir(exist_ok=True)
        with open(_LOCAL_PATH, "w", encoding="utf-8") as f:
            json.dump(items, f, ensure_ascii=False, indent=2)

        # Invalidate in-memory cache so the next read picks up the change.
        self._fallback_cache = None

        return ErrorCode(
            id=str(item_data["id"]),
            code=item_data["code"],
            severity=item_data.get("severity"),
            description=item_data.get("description"),
            solution_url=item_data.get("solution_url"),
            solution_content=item_data.get("solution_content"),
            created_at=_EPOCH,
            updated_at=now,
        )
