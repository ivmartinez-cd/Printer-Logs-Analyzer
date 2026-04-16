import os
import sys

# Agregar path al sistema para importar
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

from backend.application.services.insight_service import get_device_info
from backend.infrastructure.config import get_settings
from backend.infrastructure.database import Database
from backend.infrastructure.repositories.printer_model_repository import PrinterModelRepository


def main():
    settings = get_settings()
    serial = "BRBSN67745"

    print(f"--- Prueba de Resolución para Serial: {serial} ---")

    if not settings.insight_portal_url:
        print("Error: Credenciales de Insight Portal no configuradas en el entorno actual.")
        return

    print("\n1. Consultando a Insight API (PortalAPI)...")
    try:
        info = get_device_info(
            settings.insight_portal_url,
            settings.insight_api_key,
            settings.insight_api_secret,
            serial,
        )
        print("Respuesta de Insight:")
        print(f"  - Device ID: {info['device_id']}")
        print(f"  - Model Name: {info['model_name']}")
        print(f"  - Zone: {info['zone']}")

        if not info["device_id"]:
            print("❌ El dispositivo no se encontró en PortalAPI.")
            return

    except Exception as e:
        print(f"❌ Error conectando a Insight: {e}")
        return

    print("\n2. Intentando 'Match' local en la Base de Datos o archivo JSON...")
    db = Database()
    repo = PrinterModelRepository(db)

    model_match = repo.find_best_match(info["model_name"] or "")
    if model_match:
        print("✅ Match exitoso con un Modelo del Sistema:")
        print(f"  - ID Interno: {model_match.id}")
        print(f"  - Model Name: {model_match.model_name}")
        print(f"  - Model Code: {model_match.model_code}")
        print(f"  - Family: {model_match.family}")
    else:
        print("⚠️ No hubo match en el sistema. (Insight envió un modelo irreconocible)")


if __name__ == "__main__":
    main()
