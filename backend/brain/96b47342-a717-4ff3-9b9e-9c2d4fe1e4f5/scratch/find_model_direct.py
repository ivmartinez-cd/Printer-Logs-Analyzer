from backend.infrastructure.database import Database
from backend.infrastructure.repositories.printer_model_repository import PrinterModelRepository


def find_model():
    db_url = "postgresql://neondb_owner:npg_TF7LyjxW6kEO@ep-icy-smoke-adpxoqpt-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    print(f"Connecting to: {db_url}")

    db = Database(dsn=db_url)
    repo = PrinterModelRepository(db)

    try:
        models = repo.list_models()
        print(f"Found {len(models)} models:")
        for m in models:
            # Look for 626 or similar
            if "626" in m.model_name or "626" in m.model_code:
                print(f"MATCH: ID={m.id} Name={m.model_name} Code={m.model_code}")
            else:
                print(f"Model: {m.model_name} ({m.model_code})")
    except Exception as e:
        print(f"Error querying DB: {e}")


if __name__ == "__main__":
    find_model()
