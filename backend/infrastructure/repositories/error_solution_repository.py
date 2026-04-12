"""Repository for CPMD-extracted error solutions. Persisted in PostgreSQL/Neon.

When the database is unreachable the repository automatically falls back to a
local JSON file so the application keeps working behind a corporate firewall.
"""

from __future__ import annotations

import json
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
from uuid import UUID

from backend.domain.entities import ErrorSolution, ErrorSolutionFru
from backend.infrastructure.database import Database, DatabaseUnavailableError

_LOCAL_PATH = Path(__file__).parent.parent.parent / "data" / "error_solutions.json"

_EPOCH = datetime(2000, 1, 1, tzinfo=timezone.utc)

# Serializes concurrent writes to the local JSON fallback file.
_local_write_lock = threading.Lock()


class ErrorSolutionRepository:
    """Repository for error_solutions (PostgreSQL/Neon).

    Falls back to a local JSON file when the database is unreachable.
    """

    def __init__(self, database: Database | None = None) -> None:
        self._db = database or Database()

    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------

    def get_by_model_and_code(self, model_id: UUID, code: str) -> Optional[ErrorSolution]:
        """Return a solution by (model_id, code), or None if not found."""
        try:
            return self._get_by_model_and_code_db(model_id, code)
        except DatabaseUnavailableError:
            return self._get_by_model_and_code_local(model_id, code)

    def upsert(self, solution: ErrorSolution) -> ErrorSolution:
        """Insert or update a solution. Uses (model_id, code) as the unique key."""
        try:
            return self._upsert_db(solution)
        except DatabaseUnavailableError:
            return self._upsert_local(solution)

    def delete_by_model(self, model_id: UUID) -> int:
        """Delete all solutions for a model. Returns the number of rows deleted."""
        try:
            return self._delete_by_model_db(model_id)
        except DatabaseUnavailableError:
            return self._delete_by_model_local(model_id)

    def list_by_model(self, model_id: UUID) -> List[ErrorSolution]:
        """Return all solutions for a model, ordered by code."""
        try:
            return self._list_by_model_db(model_id)
        except DatabaseUnavailableError:
            return self._list_by_model_local(model_id)

    # ------------------------------------------------------------------
    # Database helpers
    # ------------------------------------------------------------------

    def _get_by_model_and_code_db(
        self, model_id: UUID, code: str
    ) -> Optional[ErrorSolution]:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, model_id, code, title, cause, technician_steps, frus,
                           source_audience, source_page, cpmd_hash, created_at
                    FROM error_solutions
                    WHERE model_id = %s AND code = %s
                    """,
                    (str(model_id), code),
                )
                row = cur.fetchone()
        return _row_to_solution(row) if row else None

    def _upsert_db(self, solution: ErrorSolution) -> ErrorSolution:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO error_solutions
                        (model_id, code, title, cause, technician_steps, frus,
                         source_audience, source_page, cpmd_hash)
                    VALUES (%s, %s, %s, %s, %s::jsonb, %s::jsonb, %s, %s, %s)
                    ON CONFLICT (model_id, code) DO UPDATE SET
                        title             = EXCLUDED.title,
                        cause             = EXCLUDED.cause,
                        technician_steps  = EXCLUDED.technician_steps,
                        frus              = EXCLUDED.frus,
                        source_audience   = EXCLUDED.source_audience,
                        source_page       = EXCLUDED.source_page,
                        cpmd_hash         = EXCLUDED.cpmd_hash
                    RETURNING id, model_id, code, title, cause, technician_steps, frus,
                              source_audience, source_page, cpmd_hash, created_at
                    """,
                    (
                        str(solution.model_id),
                        solution.code,
                        solution.title,
                        solution.cause,
                        json.dumps(solution.technician_steps),
                        json.dumps([fru.model_dump() for fru in solution.frus]),
                        solution.source_audience,
                        solution.source_page,
                        solution.cpmd_hash,
                    ),
                )
                row = cur.fetchone()
            conn.commit()
        return _row_to_solution(row)

    def _delete_by_model_db(self, model_id: UUID) -> int:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM error_solutions WHERE model_id = %s",
                    (str(model_id),),
                )
                count = cur.rowcount
            conn.commit()
        return count

    def _list_by_model_db(self, model_id: UUID) -> List[ErrorSolution]:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, model_id, code, title, cause, technician_steps, frus,
                           source_audience, source_page, cpmd_hash, created_at
                    FROM error_solutions
                    WHERE model_id = %s
                    ORDER BY code
                    """,
                    (str(model_id),),
                )
                rows = cur.fetchall()
        return [_row_to_solution(r) for r in rows]

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
            json.dump(items, f, ensure_ascii=False, indent=2)

    def _get_by_model_and_code_local(
        self, model_id: UUID, code: str
    ) -> Optional[ErrorSolution]:
        items = self._load_local()
        model_id_str = str(model_id)
        item = next(
            (i for i in items if i["model_id"] == model_id_str and i["code"] == code),
            None,
        )
        return _dict_to_solution(item) if item else None

    def _upsert_local(self, solution: ErrorSolution) -> ErrorSolution:
        with _local_write_lock:
            return self._upsert_local_locked(solution)

    def _upsert_local_locked(self, solution: ErrorSolution) -> ErrorSolution:
        items = self._load_local()
        model_id_str = str(solution.model_id)
        existing = next(
            (i for i in items if i["model_id"] == model_id_str and i["code"] == solution.code),
            None,
        )
        now = datetime.now(timezone.utc).isoformat()

        data = {
            "model_id": model_id_str,
            "code": solution.code,
            "title": solution.title,
            "cause": solution.cause,
            "technician_steps": solution.technician_steps,
            "frus": [fru.model_dump() for fru in solution.frus],
            "source_audience": solution.source_audience,
            "source_page": solution.source_page,
            "cpmd_hash": solution.cpmd_hash,
            "created_at": now,
        }

        if existing:
            existing.update(data)
            data = existing
        else:
            max_id = max((int(i.get("id", 0)) for i in items), default=0)
            data["id"] = max_id + 1
            items.append(data)

        self._save_local(items)
        return _dict_to_solution(data)

    def _delete_by_model_local(self, model_id: UUID) -> int:
        with _local_write_lock:
            items = self._load_local()
            model_id_str = str(model_id)
            before = len(items)
            items = [i for i in items if i["model_id"] != model_id_str]
            self._save_local(items)
            return before - len(items)

    def _list_by_model_local(self, model_id: UUID) -> List[ErrorSolution]:
        items = self._load_local()
        model_id_str = str(model_id)
        return [
            _dict_to_solution(i)
            for i in sorted(
                (i for i in items if i["model_id"] == model_id_str),
                key=lambda x: x["code"],
            )
        ]


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------


def _row_to_solution(row: tuple) -> ErrorSolution:
    """Convert a psycopg2 row to an ErrorSolution."""
    # row: id, model_id, code, title, cause, technician_steps, frus,
    #       source_audience, source_page, cpmd_hash, created_at
    raw_frus = row[6] if row[6] is not None else []
    # psycopg2 returns JSONB columns as Python objects already
    if isinstance(raw_frus, str):
        raw_frus = json.loads(raw_frus)

    raw_steps = row[5] if row[5] is not None else []
    if isinstance(raw_steps, str):
        raw_steps = json.loads(raw_steps)

    return ErrorSolution(
        id=row[0],
        model_id=UUID(str(row[1])),
        code=row[2],
        title=row[3],
        cause=row[4],
        technician_steps=raw_steps,
        frus=[ErrorSolutionFru(**f) for f in raw_frus],
        source_audience=row[7],
        source_page=row[8],
        cpmd_hash=row[9],
        created_at=row[10],
    )


def _dict_to_solution(d: dict) -> ErrorSolution:
    """Convert a JSON-fallback dict to an ErrorSolution."""
    raw_frus = d.get("frus") or []
    raw_steps = d.get("technician_steps") or []
    created_at_raw = d.get("created_at")
    created_at = (
        datetime.fromisoformat(created_at_raw) if created_at_raw else _EPOCH
    )
    return ErrorSolution(
        id=d.get("id"),
        model_id=UUID(str(d["model_id"])),
        code=d["code"],
        title=d.get("title"),
        cause=d.get("cause"),
        technician_steps=raw_steps,
        frus=[ErrorSolutionFru(**f) for f in raw_frus],
        source_audience=d.get("source_audience"),
        source_page=d.get("source_page"),
        cpmd_hash=d.get("cpmd_hash"),
        created_at=created_at,
    )
