"""
Script de prueba para la API de EKM Insight (SDS).
Prueba la conexión, autenticación y obtención de dispositivos.

Requisitos en tu archivo .env (o colócalos directo acá temporalmente):
INSIGHT_PORTAL_URL=https://tu-portal.ekminsight.com
INSIGHT_API_KEY=tu_key_aqui
INSIGHT_API_SECRET=tu_secret_aqui
"""

import os
import base64
import requests
from dotenv import load_dotenv

# Cargamos el archivo .env existente si estuviera
load_dotenv()

PORTAL_URL = "https://hp-sds-latam.insightportal.net"
API_KEY = "2bc8f5eaae344c46814190bffd40060d"
API_SECRET = "0iIxVYcz5lH8sTjl6c6B89uvyQ4qyl2bojRPv155onzqkqpANt6culpITUBldR8a"

def get_access_token() -> str:
    """Realiza el Login (Paso 2 y 3) para obtener el JWT temporal de 24 hs."""
    if not API_KEY or not API_SECRET:
        raise ValueError("Falta configurar INSIGHT_API_KEY o INSIGHT_API_SECRET")

    # 1. Concatenar Key:Secret y convertirlo a Base64
    credentials = f"{API_KEY}:{API_SECRET}"
    encoded_credentials = base64.b64encode(credentials.encode("utf-8")).decode("utf-8")
    
    # 2. Hacer POST a /PortalAPI/login
    login_url = f"{PORTAL_URL.rstrip('/')}/PortalAPI/login"
    headers = {
        "Authorization": f"Basic {encoded_credentials}",
        "Accept": "application/json"
    }

    print(f"Intentando login en: {login_url}")
    response = requests.post(login_url, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print("¡Login exitoso! JWT Obtenido.")
        # La llave del token generalmente es "access_token" según la guía
        return data.get("access_token")
    else:
        raise Exception(f"Error en Login ({response.status_code}): {response.text}")

def get_device_info(token: str, serial: str):
    """Ejemplo: Buscar info extendida de un dispositivo en particular."""
    # query param encode needed for some strings, but simple text is fine.
    url = f"{PORTAL_URL.rstrip('/')}/PortalAPI/api/devices/search?q=serial:{serial}&includeExtendedFields=true"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }
    
    print(f"\nBuscando equipo {serial}...")
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        devices = response.json()
        if devices:
            print("¡Equipo encontrado! Aquí está toda su información:")
            import json
            print(json.dumps(devices[0], indent=2))
        else:
            print(f"No se encontró ningún equipo con serial: {serial}")
    else:
        print(f"Error buscando el dispositivo ({response.status_code}): {response.text}")

def get_device_alerts(token: str, device_id: int):
    """Prueba obtener las alertas del dispositivo."""
    url_history = f"{PORTAL_URL.rstrip('/')}/PortalAPI/api/devices/{device_id}/alerts/history"
    url_current = f"{PORTAL_URL.rstrip('/')}/PortalAPI/api/devices/{device_id}/alerts/current"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }

    print(f"\nBuscando alertas activas...")
    response_current = requests.get(url_current, headers=headers)
    if response_current.status_code == 200:
        alerts = response_current.json()
        print(f"¡Éxito! Se encontraron {len(alerts)} alertas activas (current).")
        if alerts:
            import json
            print(json.dumps(alerts[:2], indent=2))
    else:
        print(f"Error ({response_current.status_code}): {response_current.text}")
        
    print(f"\nBuscando historial de alertas...")
    response_history = requests.get(url_history, headers=headers)
    if response_history.status_code == 200:
        history = response_history.json()
        print(f"¡Éxito! Se encontraron {len(history)} alertas en el historial.")
        if history:
            import json
            print(json.dumps(history[:2], indent=2))
    else:
        print(f"Error ({response_history.status_code}): {response_history.text}")

def test_connection():
    try:
        token = get_access_token()
        
        # Buscar alertas (device ID 142699 del CNNCQ520HG)
        get_device_alerts(token, 142699)
        
    except Exception as e:
        print(f"\n❌ Ocurrió un error en la prueba: {e}")

if __name__ == "__main__":
    test_connection()
