"""
============================================================
  Script de Prueba de Concepto (PoC) - Búsqueda por Serie
  Extractor Completo: Serial → Device ID → Event Logs → CSV
  HP SDS Insight Portal - API Reverse Engineering
============================================================

Flujo:
  1. Recibe un número de serie (ej: MXSCS7Q00Q)
  2. Busca en el portal usando /PortalWeb/search
  3. Parsea la respuesta HTML para extraer el Device ID numérico
  4. Descarga los Event Logs del equipo
  5. Parsea la tabla HTML y exporta a CSV

Uso:
  python poc_serial_search.py MXSCS7Q00Q
  python poc_serial_search.py MXSCS7Q00Q --cookie "JSESSIONID=tu-sesion-aqui"
  python poc_serial_search.py MXSCS7Q00Q --days 60
"""

import requests
import re
import sys
import argparse
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path

# ==========================================
# Configuración Base
# ==========================================
BASE_URL = "https://hp-sds-latam.insightportal.net/PortalWeb"
DEFAULT_COOKIE = "JSESSIONID=a8396837-9418-4c03-9e55-5e09e8a482d9"

def get_base_headers(cookie: str, referer: str = "") -> dict:
    """Headers comunes que imitan exactamente al navegador Chrome real."""
    headers = {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "es-ES,es;q=0.9,ro;q=0.8",
        "cache-control": "no-cache",
        "connection": "keep-alive",
        "cookie": cookie,
        "pragma": "no-cache",
        "sec-ch-ua": '"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
    }
    if referer:
        headers["referer"] = referer
    return headers


def get_ajax_headers(cookie: str, referer: str = "") -> dict:
    """Headers para peticiones internas AJAX (event logs)."""
    headers = {
        "accept": "*/*",
        "accept-language": "es-ES,es;q=0.9,ro;q=0.8",
        "cache-control": "no-cache",
        "connection": "keep-alive",
        "cookie": cookie,
        "host": "hp-sds-latam.insightportal.net",
        "pragma": "no-cache",
        "sec-ch-ua": '"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
        "x-ekm-usage": "dialog",
        "x-requested-with": "XMLHttpRequest",
    }
    if referer:
        headers["referer"] = referer
    return headers


# ==========================================
# PASO 1: Buscar por Número de Serie
# ==========================================
def search_by_serial(serial: str, cookie: str) -> dict | None:
    """
    Busca un equipo por número de serie en el portal HP SDS.
    Retorna un dict con la información encontrada o None si no se encontró.
    
    Campos retornados:
      - device_id: ID numérico interno del portal (ej: 239877)
      - serial: Número de serie buscado
      - url: URL completa del dispositivo en el portal
    """
    search_url = f"{BASE_URL}/search"
    
    params = [
        ("src", "powerSearch"),
        ("q", serial),
        ("s", "regions"),
        ("s", "customers"),
        ("s", "contracts"),
        ("s", "devices"),
    ]
    
    headers = get_base_headers(cookie, referer=f"{BASE_URL}/devices/239877")
    
    print(f"\n{'='*60}")
    print(f"  PASO 1: Búsqueda por Número de Serie")
    print(f"{'='*60}")
    print(f"  [*] Serial buscado: {serial}")
    print(f"  [*] URL: {search_url}")
    
    try:
        response = requests.get(search_url, params=params, headers=headers, allow_redirects=True, timeout=30)
    except requests.exceptions.RequestException as e:
        print(f"  [-] Error de conexión: {e}")
        return None
    
    print(f"  [*] HTTP Status: {response.status_code}")
    
    # --- Caso 1: El portal redirige directamente a la ficha del equipo ---
    #     Cuando el serial es único, HP SDS hace un redirect 302 a /devices/{ID}
    if response.history:
        print(f"  [*] Detectada redirección (la búsqueda encontró resultado único)")
        for r in response.history:
            print(f"      → {r.status_code} → {r.headers.get('Location', 'N/A')}")
    
    # Extraer Device ID de la URL final (después de redirects)
    final_url = response.url
    print(f"  [*] URL final: {final_url}")
    
    # Patrón 1: /devices/{ID} en la URL final (redirect directo)
    match = re.search(r'/devices/(\d+)', final_url)
    if match:
        device_id = match.group(1)
        print(f"\n  [+] ¡EQUIPO ENCONTRADO POR REDIRECCIÓN DIRECTA!")
        print(f"  [+] Device ID: {device_id}")
        return {
            "device_id": device_id,
            "serial": serial,
            "url": f"{BASE_URL}/devices/{device_id}"
        }
    
    # --- Caso 2: Página de resultados con lista (múltiples resultados) ---
    if response.status_code == 200:
        html = response.text
        
        # Guardar respuesta para debug
        debug_file = f"hp_search_debug_{serial}.html"
        with open(debug_file, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"  [*] Página de resultados guardada en: '{debug_file}'")
        
        # Buscar links a dispositivos en el HTML de resultados
        # Patrones comunes del portal HP SDS:
        #   <a href="/PortalWeb/devices/239877">
        #   href="/PortalWeb/devices/239877/hpsmart"
        device_links = re.findall(r'/PortalWeb/devices/(\d+)', html)
        
        if device_links:
            # Tomar el primer resultado (el más relevante)
            device_id = device_links[0]
            unique_ids = list(dict.fromkeys(device_links))  # Eliminar duplicados manteniendo orden
            
            print(f"\n  [+] ¡EQUIPO(S) ENCONTRADO(S) EN RESULTADOS!")
            print(f"  [+] Device IDs encontrados: {unique_ids}")
            print(f"  [+] Usando el primer resultado: {device_id}")
            
            if len(unique_ids) > 1:
                print(f"  [!] AVISO: Se encontraron {len(unique_ids)} equipos distintos.")
                print(f"      IDs: {unique_ids}")
            
            return {
                "device_id": device_id,
                "serial": serial,
                "url": f"{BASE_URL}/devices/{device_id}",
                "all_ids": unique_ids
            }
        
        # --- Caso 3: Sin resultados ---
        # Verificar si la página indica explícitamente que no se encontró
        if "no se encontr" in html.lower() or "no results" in html.lower() or "sin resultados" in html.lower():
            print(f"\n  [-] El portal indica que no se encontraron resultados para '{serial}'")
            return None
        
        # Si llegamos aquí, la respuesta tiene un formato inesperado
        print(f"\n  [?] Respuesta recibida pero no se detectaron links a dispositivos.")
        print(f"      Revisa el archivo '{debug_file}' para diagnosticar.")
        # Mostrar un preview del contenido para ayudar al debug
        preview = html[:500].replace('\n', ' ').replace('\r', '')
        print(f"      Preview: {preview}...")
        return None
    
    elif response.status_code == 302:
        print(f"\n  [-] Cookie expirada. El portal redirige a la página de login.")
        print(f"      Necesitas actualizar tu JSESSIONID.")
        return None
    
    else:
        print(f"\n  [-] Error inesperado del servidor: HTTP {response.status_code}")
        print(f"      Respuesta: {response.text[:500]}")
        return None


# ==========================================
# PASO 2: Descargar Event Logs por Device ID
# ==========================================
def fetch_event_logs(device_id: str, cookie: str, days: int = 30) -> str | None:
    """
    Descarga los Event Logs de un dispositivo por su ID numérico.
    Retorna el HTML/XML crudo de la respuesta o None si falla.
    """
    url = f"{BASE_URL}/devices/{device_id}/hpsmart/eventlogs"
    
    fecha_desde = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
    
    params = [
        ("from", fecha_desde),
        ("eventLevel", "info"),
        ("eventLevel", "warning"),
        ("eventLevel", "error"),
    ]
    
    headers = get_ajax_headers(cookie, referer=f"{BASE_URL}/devices/{device_id}/hpsmart")
    
    print(f"\n{'='*60}")
    print(f"  PASO 2: Descarga de Event Logs")
    print(f"{'='*60}")
    print(f"  [*] Device ID: {device_id}")
    print(f"  [*] Rango: últimos {days} días (desde {fecha_desde})")
    print(f"  [*] URL interna: {url}")
    
    try:
        response = requests.get(url, params=params, headers=headers, timeout=30)
    except requests.exceptions.RequestException as e:
        print(f"  [-] Error de conexión: {e}")
        return None
    
    print(f"  [*] HTTP Status: {response.status_code}")
    
    if response.status_code == 200:
        content = response.text
        print(f"  [+] Respuesta recibida ({len(content)} bytes)")
        
        # Intentar parsear como JSON primero
        try:
            data = response.json()
            print(f"  [+] Formato: JSON puro")
            return content
        except ValueError:
            pass
        
        # Si no es JSON, verificar que sea el XML/HTML esperado
        if "<ekm-ajax-response" in content or "<content>" in content:
            print(f"  [+] Formato: XML/HTML (EKM Ajax Response)")
            return content
        else:
            print(f"  [?] Formato desconocido. Preview: {content[:200]}...")
            return content
    
    elif response.status_code == 302:
        print(f"  [-] Cookie expirada. Redirigiendo a login.")
        return None
    else:
        print(f"  [-] Error HTTP {response.status_code}: {response.text[:500]}")
        return None


# ==========================================
# PASO 3: Parsear Event Logs a DataFrame
# ==========================================
def parse_event_logs(raw_content: str, serial: str) -> pd.DataFrame | None:
    """
    Extrae la tabla de événtos del HTML envuelto en XML (EKM format)
    y la convierte a un DataFrame de pandas.
    """
    print(f"\n{'='*60}")
    print(f"  PASO 3: Parseando Event Logs")
    print(f"{'='*60}")
    
    # La API de EKM/HP SDS envuelve el HTML en <content><![CDATA[ ... ]]></content>
    match = re.search(r"<content><!\[CDATA\[(.*?)\]\]></content>", raw_content, re.DOTALL)
    
    if not match:
        # Intentar parsear directamente como HTML si no tiene wrapper CDATA
        print(f"  [*] No se detectó wrapper CDATA, intentando parseo directo...")
        html_content = raw_content
    else:
        html_content = match.group(1)
        print(f"  [+] HTML extraído del wrapper CDATA ({len(html_content)} chars)")
    
    try:
        dfs = pd.read_html(html_content)
        if not dfs:
            print(f"  [-] No se encontraron tablas en el HTML.")
            return None
        
        df = dfs[0]
        df = df.fillna("")
        
        # Agregar columna de serial para identificación
        df.insert(0, "Serial", serial)
        
        print(f"  [+] ¡Conversión exitosa! {len(df)} eventos encontrados.")
        print(f"  [*] Columnas detectadas: {list(df.columns)}")
        
        return df
        
    except ImportError:
        print(f"  [-] Error: Falta 'lxml' o 'beautifulsoup4'. Ejecuta: pip install lxml")
        return None
    except Exception as e:
        print(f"  [-] Error parseando tabla HTML: {e}")
        return None


# ==========================================
# PASO 4: Exportar a CSV
# ==========================================
def export_to_csv(df: pd.DataFrame, serial: str, output_dir: str = ".") -> str:
    """Exporta el DataFrame a un archivo CSV."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"eventos_{serial}_{timestamp}.csv"
    filepath = Path(output_dir) / filename
    
    df.to_csv(filepath, index=False, encoding="utf-8-sig")
    
    print(f"\n{'='*60}")
    print(f"  PASO 4: Exportación")
    print(f"{'='*60}")
    print(f"  [+] Archivo CSV guardado: '{filepath}'")
    print(f"  [+] Total de eventos: {len(df)}")
    
    return str(filepath)


# ==========================================
# Flujo Principal
# ==========================================
def run_full_extraction(serial: str, cookie: str, days: int = 30):
    """
    Pipeline completo: Serial → Search → Device ID → Event Logs → CSV
    """
    print(f"\n{'#'*60}")
    print(f"  HP SDS Insight Portal - Extractor por Serie")
    print(f"  Serial: {serial}")
    print(f"  Fecha:  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'#'*60}")
    
    # PASO 1: Buscar el equipo
    result = search_by_serial(serial, cookie)
    if not result:
        print(f"\n[FALLO] No se pudo localizar el equipo con serial '{serial}'.")
        print(f"        Verifica que el serial sea correcto y que tu cookie sea válida.")
        sys.exit(1)
    
    device_id = result["device_id"]
    
    # PASO 2: Descargar Event Logs
    raw_content = fetch_event_logs(device_id, cookie, days)
    if not raw_content:
        print(f"\n[FALLO] No se pudieron descargar los Event Logs del equipo {device_id}.")
        sys.exit(1)
    
    # Guardar respuesta cruda como backup
    backup_file = f"hp_respuesta_{serial}.html"
    with open(backup_file, "w", encoding="utf-8") as f:
        f.write(raw_content)
    print(f"  [*] Respuesta cruda guardada en: '{backup_file}'")
    
    # PASO 3: Parsear a DataFrame
    df = parse_event_logs(raw_content, serial)
    if df is None or df.empty:
        print(f"\n[FALLO] No se pudieron parsear los Event Logs.")
        sys.exit(1)
    
    # Vista previa
    print(f"\n  [Vista Previa - 5 eventos más recientes]")
    print(f"  {'-'*75}")
    print(df.head().to_string(index=False))
    print(f"  {'-'*75}")
    
    # PASO 4: Exportar
    csv_path = export_to_csv(df, serial)
    
    print(f"\n{'#'*60}")
    print(f"  ✅ EXTRACCIÓN COMPLETADA EXITOSAMENTE")
    print(f"  Serial:    {serial}")
    print(f"  Device ID: {device_id}")
    print(f"  Eventos:   {len(df)}")
    print(f"  Archivo:   {csv_path}")
    print(f"{'#'*60}\n")
    
    return df


# ==========================================
# CLI Parser
# ==========================================
def main():
    parser = argparse.ArgumentParser(
        description="HP SDS Insight Portal - Extractor de Event Logs por Número de Serie",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ejemplos de uso:
  python poc_serial_search.py MXSCS7Q00Q
  python poc_serial_search.py MXSCS7Q00Q --days 60
  python poc_serial_search.py MXSCS7Q00Q --cookie "JSESSIONID=nueva-sesion"
  python poc_serial_search.py MXSCS7Q00Q CN1234567 JP9876543 --days 90
        """
    )
    
    parser.add_argument(
        "serials",
        nargs="+",
        help="Uno o más números de serie para buscar (ej: MXSCS7Q00Q CN1234567)"
    )
    parser.add_argument(
        "--cookie",
        default=DEFAULT_COOKIE,
        help=f"Cookie JSESSIONID completa (default: usa la cookie guardada)"
    )
    parser.add_argument(
        "--days",
        type=int,
        default=30,
        help="Días hacia atrás para descargar eventos (default: 30)"
    )
    
    args = parser.parse_args()
    
    # Asegurar formato correcto de la cookie
    cookie = args.cookie
    if not cookie.startswith("JSESSIONID="):
        cookie = f"JSESSIONID={cookie}"
    
    # Procesar cada serial
    all_results = []
    for serial in args.serials:
        serial = serial.strip().upper()
        try:
            df = run_full_extraction(serial, cookie, args.days)
            if df is not None:
                all_results.append(df)
        except SystemExit:
            print(f"  [!] Saltando serial '{serial}' por error. Continuando con el siguiente...\n")
            continue
        except Exception as e:
            print(f"  [-] Error inesperado con serial '{serial}': {e}")
            continue
    
    # Si se procesaron múltiples seriales, crear archivo consolidado
    if len(all_results) > 1:
        consolidated = pd.concat(all_results, ignore_index=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        consolidated_file = f"eventos_consolidado_{timestamp}.csv"
        consolidated.to_csv(consolidated_file, index=False, encoding="utf-8-sig")
        print(f"\n{'='*60}")
        print(f"  📊 ARCHIVO CONSOLIDADO:")
        print(f"  [+] {consolidated_file}")
        print(f"  [+] {len(args.serials)} equipos procesados")
        print(f"  [+] {len(consolidated)} eventos totales")
        print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
