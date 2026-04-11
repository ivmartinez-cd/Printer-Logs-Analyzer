"""Database connectivity helpers for PostgreSQL/Neon."""

from __future__ import annotations

import contextlib
import threading
from typing import Iterator, Optional

import psycopg2
import psycopg2.pool
from psycopg2.extensions import connection

from backend.infrastructure.config import get_settings


class DatabaseUnavailableError(Exception):
    """Raised when the database cannot be reached (network block, timeout, etc.)."""


class Database:
    """Pooled connection manager for PostgreSQL/Neon.

    Uses a ThreadedConnectionPool (min=1, max=5) so repeated queries reuse
    existing TCP connections instead of opening a new one each time.
    The pool is created lazily on first use; if the DB is unreachable the
    constructor never fails — only connect() raises DatabaseUnavailableError.
    """

    _MIN_CONN = 1
    _MAX_CONN = 5

    def __init__(self, dsn: Optional[str] = None) -> None:
        settings = get_settings()
        self._dsn = dsn or settings.db_url
        self._pool: Optional[psycopg2.pool.ThreadedConnectionPool] = None
        self._pool_lock = threading.Lock()

    def _get_pool(self) -> psycopg2.pool.ThreadedConnectionPool:
        """Return the shared pool, initializing it on first successful call."""
        if self._pool is not None:
            return self._pool
        with self._pool_lock:
            if self._pool is None:
                try:
                    self._pool = psycopg2.pool.ThreadedConnectionPool(
                        self._MIN_CONN,
                        self._MAX_CONN,
                        self._dsn,
                        connect_timeout=5,
                    )
                except psycopg2.OperationalError as exc:
                    raise DatabaseUnavailableError(str(exc)) from exc
        return self._pool

    @contextlib.contextmanager
    def connect(self) -> Iterator[connection]:
        """Yield a DB connection from the pool, returning it on exit.

        Raises DatabaseUnavailableError if the server is unreachable or the
        pool is exhausted, so callers can switch to the local fallback without
        crashing.

        Neon (and other managed Postgres services) close idle connections
        without notice.  To avoid surfacing OperationalError / InterfaceError
        to callers when a pooled connection has silently died, we pre-ping
        each connection with ``SELECT 1`` before yielding it.  If the ping
        fails we discard the connection and retry up to *max_attempts* times.
        """
        pool = self._get_pool()
        conn = None
        max_attempts = 3
        last_exc: Exception | None = None

        for _ in range(max_attempts):
            try:
                conn = pool.getconn()
            except psycopg2.pool.PoolError as exc:
                # Pool exhausted — no point retrying.
                raise DatabaseUnavailableError(str(exc)) from exc
            except psycopg2.OperationalError as exc:
                last_exc = exc
                conn = None
                continue

            # Pre-ping: verify the connection is still alive before yielding.
            try:
                with conn.cursor() as cur:
                    cur.execute("SELECT 1")
                break  # connection is live; exit retry loop
            except (psycopg2.OperationalError, psycopg2.InterfaceError) as exc:
                # Connection was closed by the server (Neon idle timeout, etc.)
                last_exc = exc
                try:
                    pool.putconn(conn, close=True)
                except Exception:
                    pass
                conn = None
        else:
            # All attempts exhausted.
            raise DatabaseUnavailableError(
                f"Could not obtain a live DB connection after {max_attempts} attempts: {last_exc}"
            ) from last_exc

        try:
            yield conn
        except Exception:
            # Roll back any open transaction before returning to the pool so
            # the connection is clean for the next caller.
            try:
                conn.rollback()
            except (psycopg2.InterfaceError, psycopg2.OperationalError):
                pass
            raise
        finally:
            if conn is not None:
                try:
                    pool.putconn(conn)
                except Exception:
                    pass

    def is_available(self) -> bool:
        """Return True if a lightweight SELECT 1 succeeds within the timeout."""
        try:
            with self.connect() as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT 1")
            return True
        except DatabaseUnavailableError:
            return False
