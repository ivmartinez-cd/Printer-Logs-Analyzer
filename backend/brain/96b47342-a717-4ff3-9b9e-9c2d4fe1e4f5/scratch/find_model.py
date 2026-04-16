import os
from pathlib import Path

from backend.infrastructure.database import Database
from backend.infrastructure.repositories.printer_model_repository import PrinterModelRepository
from dotenv import load_dotenv


def find_model():
    # Load .env from repo root
    repo_root = Path(__file__).resolve().parent.parent.parent.parent
    env_path = repo_root / ".env"
    print(f"Loading env from: {env_path}")
    load_dotenv(env_path)

    db_url = os.getenv("DB_URL")
    if not db_url:
        print("Error: DB_URL env var not set after loading .env")
        return

    db = Database(dsn=db_url)
    repo = PrinterModelRepository(db)

    try:
        models = repo.list_models()
        print(f"Found {len(models)} models:")
        for m in models:
            if "626" in m.model_name or "626" in m.model_code:
                print(f"MATCH: ID={m.id} Name={m.model_name} Code={m.model_code}")
    except Exception as e:
        print(f"Error querying DB: {e}")


if __name__ == "__main__":
    find_model()
