
import os

import psycopg2
from backend.infrastructure.config import get_settings


def run_migrations():
    settings = get_settings()
    dsn = settings.db_url
    migrations_dir = os.path.join("backend", "migrations")

    if not os.path.exists(migrations_dir):
        print(f"Error: Migrations directory {migrations_dir} not found.")
        return

    sql_files = sorted([f for f in os.listdir(migrations_dir) if f.endswith(".sql")])

    if not sql_files:
        print("No migration files found.")
        return

    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = True
        with conn.cursor() as cur:
            for sql_file in sql_files:
                print(f"Applying migration: {sql_file}...")
                with open(os.path.join(migrations_dir, sql_file), "r") as f:
                    sql = f.read()
                    cur.execute(sql)
        conn.close()
        print("All migrations applied successfully.")
    except Exception as e:
        print(f"Error applying migrations: {e}")

if __name__ == "__main__":
    run_migrations()
