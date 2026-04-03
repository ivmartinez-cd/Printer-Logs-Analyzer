"""Database connectivity helpers for PostgreSQL/Neon."""

from __future__ import annotations

import contextlib
from typing import Iterator, Optional

import psycopg2
from psycopg2.extensions import connection

from backend.infrastructure.config import get_settings


class DatabaseUnavailableError(Exception):
    """Raised when the database cannot be reached (network block, timeout, etc.)."""


class Database:
    """Lightweight connection manager."""

    def __init__(self, dsn: Optional[str] = None) -> None:
        settings = get_settings()
        self._dsn = dsn or settings.db_url

    @contextlib.contextmanager
    def connect(self) -> Iterator[connection]:
        """Yield a DB connection ensuring it closes cleanly.

        Raises DatabaseUnavailableError if the server is unreachable so that
        callers can switch to the local fallback without crashing.
        """
        try:
            conn = psycopg2.connect(self._dsn, connect_timeout=5)
        except psycopg2.OperationalError as exc:
            raise DatabaseUnavailableError(str(exc)) from exc
        try:
            yield conn
        finally:
            conn.close()

    def is_available(self) -> bool:
        """Return True if a lightweight SELECT 1 succeeds within the timeout."""
        try:
            with self.connect() as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT 1")
            return True
        except DatabaseUnavailableError:
            return False
