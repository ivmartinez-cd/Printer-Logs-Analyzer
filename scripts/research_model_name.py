import os
import sys
import logging
import re
from dotenv import load_dotenv

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from backend.infrastructure.config import get_settings
from backend.application.services.sds_web_service import SDSWebSession

def inspect_search(serial):
    settings = get_settings()
    sds = SDSWebSession(settings)
    sds._ensure_session()
    
    print(f"Buscando {serial}...")
    resp = sds.session.get(
        f"{sds.base_url}/search",
        params=[("src", "powerSearch"), ("q", serial), ("s", "devices")],
        allow_redirects=True,
    )
    
    print(f"URL Final: {resp.url}")
    print(f"Response snippet:\n{resp.text[:2000]}")
    
    # Save to file for deeper inspection if needed
    with open("search_result.html", "w", encoding="utf-8") as f:
        f.write(resp.text)
    print("\nGuardado en search_result.html")

if __name__ == "__main__":
    inspect_search("MXSCS7Q00Q")
