"""Probe HP SDS login - with correct credentials from cURL capture."""
import requests
import re
from datetime import datetime, timedelta

BASE = "https://hp-sds-latam.insightportal.net/PortalWeb"

s = requests.Session()
s.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "es-ES,es;q=0.9,ro;q=0.8",
})

# Step 1: GET login page for JSESSIONID
print("PASO 1: Obteniendo cookie inicial...")
r = s.get(f"{BASE}/login", timeout=15)
print(f"  JSESSIONID: {s.cookies.get('JSESSIONID', 'N/A')}")

# Step 2: POST login with CORRECT credentials
print("\nPASO 2: Login...")
r2 = s.post(
    f"{BASE}/login",
    data="username=ilmartinez&password=C%40nal3160",
    headers={
        "Content-Type": "application/x-www-form-urlencoded",
        "Origin": "https://hp-sds-latam.insightportal.net",
        "Referer": f"{BASE}/login",
    },
    allow_redirects=True,
    timeout=15,
)
print(f"  Status: {r2.status_code}")
print(f"  URL final: {r2.url}")
print(f"  JSESSIONID: {s.cookies.get('JSESSIONID', 'N/A')}")

logged_in = "login" not in r2.url.lower()
print(f"  Login exitoso: {logged_in}")

if not logged_in:
    print("  FALLO. Abortando.")
    exit(1)

# Step 3: Search
print("\nPASO 3: Buscando serial MXSCS7Q00Q...")
r3 = s.get(
    f"{BASE}/search",
    params=[("src", "powerSearch"), ("q", "MXSCS7Q00Q"), ("s", "devices")],
    allow_redirects=True,
    timeout=15,
)
print(f"  Status: {r3.status_code}")
print(f"  URL final: {r3.url}")

device_ids = list(set(re.findall(r'/devices/(\d+)', r3.url + r3.text)))
print(f"  Device IDs: {device_ids}")

# Step 4: Event logs
if device_ids:
    did = device_ids[0]
    print(f"\nPASO 4: Event logs del device {did}...")
    fecha = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
    r4 = s.get(
        f"{BASE}/devices/{did}/hpsmart/eventlogs",
        params=[("from", fecha), ("eventLevel", "info"), ("eventLevel", "warning"), ("eventLevel", "error")],
        headers={"x-ekm-usage": "dialog", "x-requested-with": "XMLHttpRequest", "accept": "*/*"},
        timeout=30,
    )
    print(f"  Status: {r4.status_code}")
    print(f"  Bytes: {len(r4.text)}")
    print(f"  Tiene tabla: {'<table' in r4.text}")
    print(f"  Tiene CDATA: {'CDATA' in r4.text}")
    with open("_eventlogs_test.html", "w", encoding="utf-8") as f:
        f.write(r4.text)
    print(f"  Guardado en _eventlogs_test.html")

print("\n--- COMPLETADO ---")
