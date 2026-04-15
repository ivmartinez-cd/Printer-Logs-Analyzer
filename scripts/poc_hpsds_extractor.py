import requests
import json
from datetime import datetime, timedelta

# ==========================================
# Script de Prueba de Concepto (PoC)
# Extractor API - HP SDS Insight Portal
# ==========================================

DEVICE_ID = "239877"

def fetch_printer_logs():
    url = f"https://hp-sds-latam.insightportal.net/PortalWeb/devices/{DEVICE_ID}/hpsmart/eventlogs"
    
    fecha_desde = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
    
    params = [
        ("from", fecha_desde),
        ("eventLevel", "info"),
        ("eventLevel", "warning"),
        ("eventLevel", "error")
    ]
    
    headers = {
        "accept": "*/*",
        "accept-language": "es-ES,es;q=0.9,ro;q=0.8",
        "cache-control": "no-cache",
        "connection": "keep-alive",
        "cookie": "JSESSIONID=a8396837-9418-4c03-9e55-5e09e8a482d9",
        "host": "hp-sds-latam.insightportal.net",
        "pragma": "no-cache",
        "referer": f"https://hp-sds-latam.insightportal.net/PortalWeb/devices/{DEVICE_ID}/hpsmart",
        "sec-ch-ua": '"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
        "x-ekm-usage": "dialog",
        "x-requested-with": "XMLHttpRequest"
    }
    
    print(f"\n[*] Ejecutando Extractor para Equipo ID: {DEVICE_ID}")
    print(f"[*] Consultando fecha desde: {fecha_desde}")
    print(f"[*] URL Interna: {url}\n")
    
    response = requests.get(url, params=params, headers=headers)
    
    print(f"[*] Código HTTP de Respuesta: {response.status_code}")
    
    if response.status_code == 200:
        print("[+] ¡Conexión Exitosa con la API de Insight Portal!")
        try:
            data = response.json()
            print("\n[+] TIPO DE RESPUESTA: JSON PURO")
            print(f"[*] Claves detectadas en el JSON raíz: {list(data.keys())[:5]}")
            with open("hp_respuesta_muestra.json", "w", encoding="utf-8") as f:
                json.dump(data, f, indent=4, ensure_ascii=False)
            print("[*] Archivo guardado correctamente en: 'hp_respuesta_muestra.json'")
        except ValueError:
            print("\n[+] TIPO DE RESPUESTA: HTML Parcial / Tabla dinámica")
            texto_preview = response.text[:300].replace('\n', '')
            print(f"[*] Preview: {texto_preview}...")
            with open("hp_respuesta_muestra.html", "w", encoding="utf-8") as f:
                f.write(response.text)
            print("[*] Archivo guardado en: 'hp_respuesta_muestra.html'")
    elif response.status_code == 302:
        print("\n[-] Cookie Expirada. Redirigiendo a Login.")
    else:
        print(f"\n[-] Error de conexión. Servidor devolvió código de error: {response.status_code}")
        print("Muestra del error del servidor:", response.text[:500])

if __name__ == "__main__":
    fetch_printer_logs()
