import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

from backend.application.services.insight_service import _get_jwt, _insight_get, get_device_info
from backend.infrastructure.config import get_settings


def main():
    settings = get_settings()
    serial = "MXSCS7Q00Q"

    print(f"Buscando ID de {serial}...")
    info = get_device_info(
        settings.insight_portal_url,
        settings.insight_api_key,
        settings.insight_api_secret,
        serial,
    )

    device_id = info["device_id"]
    if not device_id:
        print("Equip no encontrado!")
        return

    print(f"Device ID: {device_id}")

    token = _get_jwt(
        settings.insight_portal_url,
        settings.insight_api_key,
        settings.insight_api_secret,
    )
    base = settings.insight_portal_url.rstrip("/")

    ep = f"{base}/PortalAPI/api/devices/{device_id}/consumables"
    print(f"\n--- Probando Endpoint: {ep} ---")
    try:
        res = _insight_get(ep, token)
        print("SUCCESS! Data keys:")
        if isinstance(res, dict) and "consumables" in res:
            consumables = res["consumables"]
            print(f"Se encontraron {len(consumables)} repuestos/consumibles:")
            for c in consumables:
                print(
                    f"- Tipo: {c.get('type')}, Descripción: {c.get('description')}, SKU: {c.get('sku')}, Nivel: {c.get('percentLeft')}%"
                )
            print("Estructura completa de uno (para analisis):")
            print(consumables[1] if len(consumables) > 1 else consumables[0])
    except Exception as e:
        print(f"Failed: {e}")


if __name__ == "__main__":
    main()
