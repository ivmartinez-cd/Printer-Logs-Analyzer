import asyncio
import json
import logging
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import requests
from backend.infrastructure.config import Settings

_logger = logging.getLogger(__name__)

# Cache structure: { serial: (expiration_timestamp, list_of_incidents) }
_cds_cache: Dict[str, tuple[float, List[Dict[str, Any]]]] = {}
CACHE_TTL = 600.0  # 10 minutes in seconds

# Circuit Breaker state
_consecutive_failures = 0
_circuit_breaker_until = 0.0
FAILURE_THRESHOLD = 3
COOLDOWN_PERIOD = 300.0  # 5 minutes

def call_soap_method(settings: Settings, action: str, body_xml: str) -> str:
    global _consecutive_failures, _circuit_breaker_until

    # Check circuit breaker status
    now = time.time()
    if now < _circuit_breaker_until:
        _logger.warning("CDS SOAP Circuit breaker active. Skipping request for action %s.", action)
        raise requests.RequestException("Circuit breaker active: CDS SOAP service is offline.")

    url = "https://wsg.cdsisa.com.ar/wsAyC_server.php"
    headers = {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction": f"urn:wsAyC#{action}"
    }
    payload = f"""<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="urn:wsAyC">
  <soap:Body>
    {body_xml}
  </soap:Body>
</soap:Envelope>"""
    try:
        # Tight connect (3s) and read (7s) timeouts to prevent blocking worker threads
        r = requests.post(url, data=payload, headers=headers, verify=False, timeout=(3.05, 7.0))
        r.raise_for_status()

        # Reset circuit breaker on success
        _consecutive_failures = 0
        _circuit_breaker_until = 0.0

        return r.text
    except Exception as e:
        _consecutive_failures += 1
        _logger.error("CDS SOAP request failed (consecutive=%d): %s", _consecutive_failures, e)
        if _consecutive_failures >= FAILURE_THRESHOLD:
            _circuit_breaker_until = time.time() + COOLDOWN_PERIOD
            _logger.error("CDS SOAP reached %d failures. Tripping circuit breaker for 5 minutes.", FAILURE_THRESHOLD)
        raise

def parse_soap_response(xml_text: str, tag_name: str) -> Any:
    # Try finding tag_name, or fallback to Respuesta / Result
    for tag in [tag_name, "Respuesta", "Result"]:
        start_tag = f'<{tag} xsi:type="xsd:string">'
        if start_tag in xml_text:
            json_str = xml_text.split(start_tag)[1].split(f'</{tag}>')[0]
            json_str = json_str.replace("&quot;", '"').replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&")
            try:
                return json.loads(json_str)
            except Exception as e:
                _logger.warning("Failed to parse JSON response from tag %s: %s", tag, e)
    return None

_CDS_TEMPLATE_PREFIXES = ("Fallas:", "Mensaje de error:", "Observaciones:")

def _is_cds_template(text: str) -> bool:
    """Return True if text is a CDS auto-generated form header, not real work done."""
    return any(text.startswith(p) for p in _CDS_TEMPLATE_PREFIXES)

def fetch_machine_counters_sync(settings: Settings, machine_id: str) -> List[Dict[str, Any]]:
    """Fetch all counter readings for a machine via getCounters."""
    try:
        xml_res = call_soap_method(
            settings, "getCounters",
            f"<tns:getCounters><IdMaquina>{machine_id}</IdMaquina></tns:getCounters>"
        )
        data = parse_soap_response(xml_res, "getCountersResponse")
        if data and isinstance(data, list):
            return data
    except Exception as e:
        _logger.warning("Failed to fetch machine counters for machine %s: %s", machine_id, e)
    return []

def find_counter_for_incident(
    counters: List[Dict[str, Any]],
    fecha_str: str,
    fecha_cierre_str: Optional[str],
) -> Optional[str]:
    """Return the best matching counter reading for an incident.

    Strategy:
    1. Prefer 'Informe S. Tecnico' readings within [Fecha, FechaCierre].
    2. Fall back to the closest reading on or before the upper bound.
    """
    FMT = "%d/%m/%Y %H:%M:%S"
    FMT_D = "%d/%m/%Y"

    try:
        fecha_dt = datetime.strptime(fecha_str, FMT)
    except ValueError:
        return None

    upper: datetime
    if fecha_cierre_str:
        try:
            upper = datetime.strptime(fecha_cierre_str, FMT)
        except ValueError:
            upper = fecha_dt + timedelta(days=30)
    else:
        upper = fecha_dt + timedelta(days=30)

    parsed: List[tuple[datetime, str, str]] = []
    for entry in counters:
        c = entry.get("Counter", entry) if isinstance(entry, dict) else {}
        raw_date = c.get("FechaToma", "")
        valor = c.get("Contador")
        tipo = c.get("TipoToma", "")
        if not valor:
            continue
        for fmt in (FMT_D, FMT):
            try:
                parsed.append((datetime.strptime(raw_date, fmt), str(valor), tipo))
                break
            except ValueError:
                pass

    if not parsed:
        return None

    # 1. "Informe S. Tecnico" within [fecha_dt, upper]
    st = [(dt, v) for dt, v, t in parsed if t == "Informe S. Tecnico" and fecha_dt <= dt <= upper]
    if st:
        return max(st, key=lambda x: x[0])[1]

    # 2. Any reading on or before upper, take the latest
    past = [(dt, v) for dt, v, _ in parsed if dt <= upper]
    if past:
        return max(past, key=lambda x: x[0])[1]

    return None

def fetch_incident_details_sync(settings: Settings, incident_id: str) -> tuple[List[Dict[str, Any]], List[str]]:
    """Fetch replacements and jobs synchronously for a single incident."""
    replacements = []
    jobs = []

    # 1. Fetch Replacements
    try:
        xml_res = call_soap_method(settings, "getIncidentReplacements", f"<tns:getIncidentReplacements><id>{incident_id}</id></tns:getIncidentReplacements>")
        repl_data = parse_soap_response(xml_res, "getIncidentReplacementsResponse")
        if repl_data and isinstance(repl_data, list):
            for r in repl_data:
                repl = r.get("Replacement")
                if repl:
                    replacements.append({
                        "articulo": repl.get("Articulo", "Desconocido"),
                        "cantidad": int(repl.get("Cantidad", 1))
                    })
    except Exception as e:
        _logger.warning("Failed to fetch replacements for incident %s: %s", incident_id, e)

    # 2. Fetch Jobs (Performed Tasks)
    try:
        xml_res = call_soap_method(settings, "getIncidentJobs", f"<tns:getIncidentJobs><id>{incident_id}</id></tns:getIncidentJobs>")
        jobs_data = parse_soap_response(xml_res, "getIncidentJobsResponse")
        if jobs_data and isinstance(jobs_data, list):
            for j in jobs_data:
                job = j.get("Job", {})
                desc = job.get("Descripcion", "").strip()
                observ = job.get("Observ", "").strip()
                if desc and desc != "." and len(desc) > 2 and not _is_cds_template(desc):
                    jobs.append(desc)
                if observ and observ != "." and len(observ) > 2 and observ not in ["OK", "ok", "Ok", "OK.", "ok."] and not _is_cds_template(observ):
                    jobs.append(observ)
    except Exception as e:
        _logger.warning("Failed to fetch jobs for incident %s: %s", incident_id, e)

    return replacements, jobs

async def fetch_incident_details_async(settings: Settings, incident_id: str) -> tuple[List[Dict[str, Any]], List[str]]:
    return await asyncio.to_thread(fetch_incident_details_sync, settings, incident_id)

def get_mock_incidents_for_test() -> List[Dict[str, Any]]:
    """Generate mock incidents for BRBSN9YYK7 to test rendering and date filtering."""
    now = datetime.now()

    # 1. Incident 1: 15 days ago (should show)
    date_1 = (now - timedelta(days=15)).strftime("%d/%m/%Y %H:%M:%S")
    # 2. Incident 2: 45 days ago (should show)
    date_2 = (now - timedelta(days=45)).strftime("%d/%m/%Y %H:%M:%S")
    # 3. Incident 3: 7 months ago (should NOT show, older than 6 months)
    date_3 = (now - timedelta(days=210)).strftime("%d/%m/%Y %H:%M:%S")

    raw_mock = [
        {
            "id": "mock-inc-1",
            "numero_incidente": "826546",
            "fecha": date_1,
            "motivo": "Atasco constante de papel en bandeja 2",
            "estado": "Cerrado",
            "contador": "85240",
            "repuestos": [{"articulo": "Pickup Roller Tray 2", "cantidad": 1}],
            "tareas_realizadas": [
                "Se reemplaza rodillo de toma de papel de bandeja 2",
                "Limpieza general de rodillos de registro",
                "Se testea funcionamiento y alimentación de papel: OK"
            ]
        },
        {
            "id": "mock-inc-2",
            "numero_incidente": "822753",
            "fecha": date_2,
            "motivo": "La impresora hace ruidos al encender",
            "estado": "Cerrado",
            "contador": "81050",
            "repuestos": [],
            "tareas_realizadas": [
                "Se revisa equipo por ruidos al encender",
                "Se lubrican engranajes del mecanismo principal de tracción",
                "Se realiza prueba de encendido y testeo de funcionamiento: OK"
            ]
        },
        {
            "id": "mock-inc-3",
            "numero_incidente": "811230",
            "fecha": date_3,
            "motivo": "Impresión con manchas negras",
            "estado": "Cerrado",
            "contador": "52040",
            "repuestos": [{"articulo": "Fuser Asm", "cantidad": 1}],
            "tareas_realizadas": [
                "Se limpia el cristal de exposición",
                "Se realiza mantenimiento preventivo general"
            ]
        }
    ]

    # Apply the 6 months filter locally to make sure it functions properly
    six_months_ago = now - timedelta(days=180)
    filtered = []
    for inc in raw_mock:
        try:
            fecha_dt = datetime.strptime(inc["fecha"], "%d/%m/%Y %H:%M:%S")
            if fecha_dt >= six_months_ago:
                filtered.append(inc)
        except ValueError:
            pass
    return filtered

async def get_cds_incidents_for_serial(settings: Settings, serial: str) -> List[Dict[str, Any]]:
    """Retrieve detailed incidents from Canal Directo SOAP service within last 6 months."""
    serial = serial.strip().upper()
    if not serial:
        return []

    # Check cache
    now_ts = time.time()
    if serial in _cds_cache:
        expire, cached_data = _cds_cache[serial]
        if now_ts < expire:
            _logger.info("Returning cached CDS incidents for serial %s", serial)
            return cached_data

    # Mock fallback for test serial BRBSN9YYK7
    if serial == "BRBSN9YYK7":
        _logger.info("Serving mock incidents for test serial BRBSN9YYK7")
        mock_data = get_mock_incidents_for_test()
        _cds_cache[serial] = (now_ts + CACHE_TTL, mock_data)
        return mock_data

    try:
        # 1. Resolve machine ID
        xml_res = await asyncio.to_thread(
            call_soap_method,
            settings,
            "getMachineBySerial",
            f"<tns:getMachineBySerial><SerialNumber>{serial}</SerialNumber></tns:getMachineBySerial>"
        )
        machine_data = parse_soap_response(xml_res, "getMachineBySerialResponse")
        if not machine_data or "Machine" not in machine_data:
            _logger.warning("Machine with serial %s not found in CDS", serial)
            _cds_cache[serial] = (now_ts + CACHE_TTL, [])
            return []

        machine = machine_data["Machine"]
        machine_id = machine.get("id")
        company_id = machine.get("empresa_id")
        if not machine_id:
            _cds_cache[serial] = (now_ts + CACHE_TTL, [])
            return []

        # 2. Fetch incidents list
        incidents_xml = await asyncio.to_thread(
            call_soap_method,
            settings,
            "getMachineIncidents",
            f"""<tns:getMachineIncidents>
                  <IdMaquina>{machine_id}</IdMaquina>
                  <IdEmpresa>{company_id or ""}</IdEmpresa>
                  <IdSucursal></IdSucursal>
                  <IdSector></IdSector>
                  <top>50</top>
                  <estado></estado>
                  <tipo></tipo>
                </tns:getMachineIncidents>"""
        )
        inc_data = parse_soap_response(incidents_xml, "getMachineIncidentsResponse")
        if not inc_data or not isinstance(inc_data, list):
            _cds_cache[serial] = (now_ts + CACHE_TTL, [])
            return []

        # 3. Filter last 6 months of incidents
        six_months_ago = datetime.now() - timedelta(days=180)
        recent_incidents = []

        for inc_wrapper in inc_data:
            inc = inc_wrapper.get("Incident", {})
            fecha_str = inc.get("Fecha")
            if not fecha_str:
                continue
            try:
                # Format is DD/MM/YYYY HH:MM:SS
                fecha_dt = datetime.strptime(fecha_str, "%d/%m/%Y %H:%M:%S")
                if fecha_dt >= six_months_ago:
                    recent_incidents.append(inc)
            except ValueError:
                _logger.warning("Failed to parse date string %s", fecha_str)

        # 4. Fetch machine counters ONCE for all incidents
        machine_counters = await asyncio.to_thread(fetch_machine_counters_sync, settings, machine_id)

        # 5. Build lightweight incident list — no per-incident SOAP calls
        results = []
        for inc in recent_incidents:
            fecha_str = inc.get("Fecha", "")
            results.append({
                "id": inc.get("id", ""),
                "numero_incidente": inc.get("NroIncidente", ""),
                "fecha": fecha_str,
                "motivo": inc.get("Motivo", "Sin motivo"),
                "estado": inc.get("Estado", "Desconocido"),
                "contador": find_counter_for_incident(
                    machine_counters, fecha_str, inc.get("FechaCierre")
                ),
            })

        # Sort by date descending
        def get_date_key(item: Dict[str, Any]) -> datetime:
            try:
                return datetime.strptime(item["fecha"], "%d/%m/%Y %H:%M:%S")
            except Exception:
                return datetime.min

        results.sort(key=get_date_key, reverse=True)

        _cds_cache[serial] = (now_ts + CACHE_TTL, results)
        return results

    except Exception as exc:
        _logger.error("Error retrieving CDS incidents for serial %s: %s", serial, exc)
        return []
