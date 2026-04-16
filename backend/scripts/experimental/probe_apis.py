import json
import os
import sys

from dotenv import load_dotenv

load_dotenv('.env')

sys.path.append(os.path.abspath('.'))
from backend.application.services.sds_web_service import SDSWebSession
from backend.infrastructure.config import Settings

settings = Settings(DB_URL='sqlite:///:memory:', API_KEY='dummy', SDS_WEB_USERNAME=os.environ.get('SDS_WEB_USERNAME'), SDS_WEB_PASSWORD=os.environ.get('SDS_WEB_PASSWORD'))
session = SDSWebSession(settings)
session._ensure_session()

device_id = "239877"
endpoints = [
    f"/api/devices/{device_id}",
    f"/api/device/{device_id}",
    f"/devices/{device_id}/details",
    f"/devices/{device_id}/summary",
    f"/api/devices/{device_id}/summary"
]

for ep in endpoints:
    url = f"{session.base_url}{ep}"
    print(f"Testing {url} ...")
    resp = session.session.get(url, headers={"Accept": "application/json"})
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        try:
            data = resp.json()
            print("Found JSON! Keys:", data.keys())
            if 'model' in str(data).lower():
                print("Model string exists in JSON!")
            break
        except Exception:
            if len(resp.text) > 0:
                print("Returned HTML/Text instead of JSON.")
