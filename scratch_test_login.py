
import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from backend.infrastructure.config import get_settings
from backend.application.services.sds_web_service import get_session, SDSWebAuthError

def test_connection():
    try:
        settings = get_settings()
        if not settings.sds_web_username or not settings.sds_web_password:
            print("ERROR: Credentials not configured in .env")
            return
            
        print(f"Attempting login as: {settings.sds_web_username}")
        session = get_session(settings)
        # Trigger login
        session._ensure_session()
        print("SUCCESS: Logged in and session is valid.")
        
    except SDSWebAuthError as e:
        print(f"AUTH ERROR: {e}")
    except Exception as e:
        print(f"UNEXPECTED ERROR: {e}")

if __name__ == "__main__":
    test_connection()
