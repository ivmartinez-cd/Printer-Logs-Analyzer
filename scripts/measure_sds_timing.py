import sys
import os
import time
import logging
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Ensure we can import from backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.infrastructure.config import Settings
from backend.application.services.sds_web_service import SDSWebSession

# Configure basic logging to see the phase logs from the service
logging.basicConfig(level=logging.INFO, format='%(message)s')

def measure():
    settings = Settings(
        DB_URL="sqlite:///:memory:",
        API_KEY="dummy",
        SDS_WEB_USERNAME=os.environ.get("SDS_WEB_USERNAME"),
        SDS_WEB_PASSWORD=os.environ.get("SDS_WEB_PASSWORD")
    )
    session = SDSWebSession(settings)
    
    serial = "MXSCS7Q00Q"
    print(f"--- Iniciando medición para serial: {serial} ---")
    
    start_total = time.perf_counter()
    
    # Phase 1: Login (implicit in ensure_session)
    print("1. Ejecutando Login...")
    t1 = time.perf_counter()
    session._ensure_session()
    print(f"   Done. Login tomó {time.perf_counter() - t1:.2f}s")
    
    # Phase 2: Search & Resolve
    print("2. Buscando dispositivo y resolviendo modelo...")
    t2 = time.perf_counter()
    info = session.search_device(serial)
    print(f"   Done. Info: {info}")
    print(f"   Search tomó {time.perf_counter() - t2:.2f}s")
    
    # Phase 3: Fetch Logs
    print("3. Extrayendo logs de eventos (7 días)...")
    t3 = time.perf_counter()
    html_content = session.fetch_event_logs_html(info["id"], days=7)
    print(f"   Done. Tamaño del HTML: {len(html_content)} bytes")
    print(f"   Fetch tomó {time.perf_counter() - t3:.2f}s")
    
    total = time.perf_counter() - start_total
    print(f"\n--- TIEMPO TOTAL: {total:.2f}s ---")

if __name__ == "__main__":
    measure()
