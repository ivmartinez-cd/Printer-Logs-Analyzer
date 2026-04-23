"""Database migration runner for PostgreSQL/Neon."""

import logging
import os
from pathlib import Path

import psycopg2
from backend.infrastructure.config import get_settings

logging.basicConfig(level=logging.INFO, format="%(name)s %(levelname)s: %(message)s")
logger = logging.getLogger(__name__)


def run_migrations():
    """Apply all SQL migrations from backend/migrations/ in order."""
    settings = get_settings()
    # Path relative to project root since it's intended to be run as python -m backend.scripts.run_migrations
    migrations_dir = Path("backend/migrations")

    if not migrations_dir.exists():
        logger.error(f"Migrations directory {migrations_dir} not found.")
        return

    logger.info("Connecting to database to run migrations...")
    try:
        conn = psycopg2.connect(settings.db_url, connect_timeout=10)
        conn.autocommit = False
        cur = conn.cursor()

        # Create migrations tracking table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS schema_migrations (
                filename TEXT PRIMARY KEY,
                applied_at TIMESTAMPTZ DEFAULT NOW()
            );
        """)
        conn.commit()

        # Get already applied migrations
        cur.execute("SELECT filename FROM schema_migrations;")
        applied = {row[0] for row in cur.fetchall()}

        # List and sort migration files
        migration_files = sorted(migrations_dir.glob("*.sql"))

        for sql_file in migration_files:
            if sql_file.name in applied:
                logger.info(f"Migration {sql_file.name} already applied. Skipping.")
                continue

            logger.info(f"Applying migration: {sql_file.name}...")
            with open(sql_file, "r", encoding="utf-8") as f:
                sql = f.read()

            try:
                if sql.strip():
                    cur.execute(sql)
                cur.execute(
                    "INSERT INTO schema_migrations (filename) VALUES (%s)", (sql_file.name,)
                )
                conn.commit()
                logger.info(f"Migration {sql_file.name} applied successfully.")
            except Exception as e:
                conn.rollback()
                logger.error(f"Failed to apply migration {sql_file.name}: {e}")
                raise
            finally:
                pass

        logger.info("All migrations processed successfully.")

    except Exception as e:
        logger.error(f"Migration runner failed: {e}")
        raise
    finally:
        if "conn" in locals() and conn:
            conn.close()


if __name__ == "__main__":
    run_migrations()
