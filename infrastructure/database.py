"""Database connectivity helpers for PostgreSQL/Neon."""

from __future__ import annotations

import contextlib
from typing import Iterator, Optional

import psycopg2
from psycopg2.extensions import connection

from infrastructure.config import get_settings


class Database:
    """Lightweight connection manager."""

    def __init__(self, dsn: Optional[str] = None) -> None:
        settings = get_settings()
        self._dsn = dsn or settings.db_url

    @contextlib.contextmanager
    def connect(self) -> Iterator[connection]:
        """Yield a DB connection ensuring it closes cleanly."""
        conn = psycopg2.connect(self._dsn)
        try:
            yield conn
        finally:
            conn.close()
