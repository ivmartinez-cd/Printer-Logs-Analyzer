"""Standalone AI diagnostic script for HP printer logs.

Usage (desde la raíz del repo):
    python backend/scripts/ai_diagnose.py samples/hp_log.txt

Requisitos:
    pip install anthropic
    ANTHROPIC_API_KEY debe estar en .env en la raíz del repo.
"""

from __future__ import annotations

import json
import os
import sys
import time
from collections import Counter
from datetime import timedelta
from pathlib import Path
from typing import Dict, List

# Insertar raíz del repo en sys.path para que funcionen los imports backend.*
# __file__ = backend/scripts/ai_diagnose.py → .parent.parent.parent = repo root
_REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(_REPO_ROOT))

# Forzar UTF-8 en stdout para caracteres en español en consolas Windows (cp1252)
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Cargar .env antes de importar módulos del backend (config.py también lo hace,
# pero necesitamos ANTHROPIC_API_KEY disponible desde el inicio).
from dotenv import load_dotenv  # noqa: E402

load_dotenv(_REPO_ROOT / ".env")

try:
    import anthropic
except ImportError:
    print("Error: el paquete 'anthropic' no está instalado.")
    print("  Instalalo con: pip install anthropic")
    sys.exit(1)

from backend.application.parsers.log_parser import LogParser  # noqa: E402
from backend.application.services.analysis_service import AnalysisService  # noqa: E402
from backend.domain.entities import AnalysisResult, EnrichedEvent, Incident  # noqa: E402
from backend.infrastructure.repositories.error_code_repository import (  # noqa: E402
    ErrorCodeRepository,
)

# ---------------------------------------------------------------------------
# Pricing — Claude 4.6 Opus (Abril 2026)
_PRICE_INPUT = 15.00
_PRICE_OUTPUT = 75.00
_PRICE_CACHE_WRITE = 18.75
_PRICE_CACHE_READ = 1.50

SYSTEM_PROMPT = """Sos un técnico de impresoras HP LaserJet Enterprise. Recibís un análisis \
agrupado de eventos del log y generás un diagnóstico breve para el \
operador de servicio.

Formato de salida (máximo 150 palabras):

DIAGNÓSTICO: 1-2 oraciones con el problema principal y patrón clave.
ACCIÓN: una línea con la recomendación concreta.
PRIORIDAD: alta / media / baja.

Reglas:
- Español rioplatense, técnico y directo
- Mencioná correlaciones temporales solo si son claras y accionables
- No inventes códigos ni descripciones fuera de los datos
- Sin bullets ni secciones extra"""


# ---------------------------------------------------------------------------
# compute_pattern
# ---------------------------------------------------------------------------


def compute_pattern(incident: Incident) -> str:
    """Genera una descripción breve del patrón temporal del incidente."""
    events = incident.events
    n = len(events)

    if n == 1:
        return "1 evento aislado"

    duration = incident.end_time - incident.start_time
    total_seconds = duration.total_seconds()
    total_hours = total_seconds / 3600
    total_days = duration.days

    # Detectar ráfagas: eventos con < 30 min entre consecutivos
    # NOTE: se usa 30 min como umbral, igual que DiagnosticPanel en el frontend.
    BURST_GAP = timedelta(minutes=30)
    burst_sizes: List[int] = []
    current_burst = 1
    for i in range(1, n):
        gap = events[i].timestamp - events[i - 1].timestamp
        if gap <= BURST_GAP:
            current_burst += 1
        else:
            if current_burst > 1:
                burst_sizes.append(current_burst)
            current_burst = 1
    if current_burst > 1:
        burst_sizes.append(current_burst)

    if total_seconds < 3600:
        mins = int(total_seconds / 60) or 1
        return f"{n} eventos en {mins} minuto{'s' if mins != 1 else ''}"

    if total_days == 0:
        h = f"{total_hours:.0f}h"
        if burst_sizes:
            return f"Racha de {max(burst_sizes)} eventos concentrada en {h}"
        return f"{n} eventos en {h}"

    days_label = f"{total_days + 1} días"
    if burst_sizes:
        return f"Rachas de hasta {max(burst_sizes)} eventos en {days_label}"
    return f"{n} eventos distribuidos en {days_label}"


# ---------------------------------------------------------------------------
# build_payload
# ---------------------------------------------------------------------------


def build_payload(result: AnalysisResult, catalog: dict) -> dict:
    """Arma el dict compacto para enviar al modelo."""
    all_events = [evt for inc in result.incidents for evt in inc.events]

    timestamps = [e.timestamp for e in all_events]
    counters = [e.counter for e in all_events]

    # Firmware más frecuente en el log
    firmware_counts = Counter(e.firmware for e in all_events if e.firmware)
    firmware = firmware_counts.most_common(1)[0][0] if firmware_counts else None

    metadata = {
        "date_range": (
            f"{min(timestamps).strftime('%d-%b-%Y %H:%M')}"
            f" – {max(timestamps).strftime('%d-%b-%Y %H:%M')}"
        ),
        "total_events": len(all_events),
        "global_severity": result.global_severity,
        "counter_range": [min(counters), max(counters)],
        "firmware": firmware,
    }

    # Ordenar por severity_weight desc, luego occurrences desc
    sorted_incidents = sorted(
        result.incidents,
        key=lambda i: (i.severity_weight, i.occurrences),
        reverse=True,
    )

    incidents_payload = []
    for inc in sorted_incidents:
        cat_entry = catalog.get(inc.code)
        incidents_payload.append(
            {
                "code": inc.code,
                "description": cat_entry.description if cat_entry else None,
                "severity": inc.severity,
                "occurrences": inc.occurrences,
                "start": inc.start_time.strftime("%d-%b-%Y %H:%M"),
                "end": inc.end_time.strftime("%d-%b-%Y %H:%M"),
                "pattern": compute_pattern(inc),
            }
        )

    return {"metadata": metadata, "incidents": incidents_payload}


# ---------------------------------------------------------------------------
# call_claude
# ---------------------------------------------------------------------------


def call_claude(payload: dict) -> tuple[str, object]:
    """Llama a la API de Anthropic con prompt caching. Retorna (texto, usage)."""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("Error: ANTHROPIC_API_KEY no está definida en el entorno ni en .env")
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)

    response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=400,
        system=[
            {
                "type": "text",
                "text": SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        messages=[
            {
                "role": "user",
                "content": json.dumps(payload, ensure_ascii=False, indent=2),
            }
        ],
    )

    text = response.content[0].text
    return text, response.usage


# ---------------------------------------------------------------------------
# compute_cost
# ---------------------------------------------------------------------------


def compute_cost(usage: object) -> float:
    """Calcula el costo en USD a partir del objeto usage de Anthropic."""
    input_tok = getattr(usage, "input_tokens", 0) or 0
    output_tok = getattr(usage, "output_tokens", 0) or 0
    cache_write = getattr(usage, "cache_creation_input_tokens", 0) or 0
    cache_read = getattr(usage, "cache_read_input_tokens", 0) or 0

    return (
        input_tok * _PRICE_INPUT / 1_000_000
        + output_tok * _PRICE_OUTPUT / 1_000_000
        + cache_write * _PRICE_CACHE_WRITE / 1_000_000
        + cache_read * _PRICE_CACHE_READ / 1_000_000
    )


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------


def main() -> None:
    # Verificar API key antes de hacer cualquier trabajo pesado
    if not os.getenv("ANTHROPIC_API_KEY"):
        print("Error: ANTHROPIC_API_KEY no está definida.")
        print("  Agregá ANTHROPIC_API_KEY=sk-ant-... al .env en la raíz del repo.")
        sys.exit(1)

    if len(sys.argv) < 2:
        print("Uso: python backend/scripts/ai_diagnose.py <ruta-al-log>")
        sys.exit(1)

    log_path = Path(sys.argv[1])
    if not log_path.exists():
        print(f"Error: archivo no encontrado — {log_path}")
        sys.exit(1)

    # 1. Parsear
    print(f"Parseando {log_path}...")
    parser = LogParser()
    try:
        report = parser.parse_file(log_path)
    except Exception as exc:
        print(f"Error al leer el archivo: {exc}")
        sys.exit(1)

    if not report.events:
        print("Error: el log no contiene eventos válidos.")
        if report.errors:
            print(f"  {len(report.errors)} líneas con error de parseo.")
        sys.exit(1)

    print(f"  {len(report.events)} eventos | {len(report.errors)} líneas con error")

    # 2. Cargar catálogo y enriquecer eventos
    print("Cargando catálogo de códigos...")
    codes_in_log = list({e.code for e in report.events})
    catalog: Dict[str, object] = {}
    try:
        repo = ErrorCodeRepository()
        catalog = repo.get_by_codes(codes_in_log)
        print(f"  {len(catalog)}/{len(codes_in_log)} códigos encontrados en catálogo")
    except Exception as exc:
        print(f"  Aviso: catálogo no disponible ({exc}). Continuando sin descripciones.")

    # 3. Event → EnrichedEvent con datos del catálogo
    enriched = []
    for evt in report.events:
        cat = catalog.get(evt.code)
        enriched.append(
            EnrichedEvent(
                **evt.model_dump(),
                code_severity=cat.severity if cat else None,
                code_description=cat.description if cat else None,
                code_solution_url=cat.solution_url if cat else None,
                code_solution_content=cat.solution_content if cat else None,
            )
        )

    # 4. Analizar
    print("Analizando incidentes...")
    service = AnalysisService()
    result = service.analyze(enriched)
    print(f"  {len(result.incidents)} incidentes — severidad global: {result.global_severity}")

    # 5. Armar payload
    payload = build_payload(result, catalog)

    # 6. Llamar a Claude
    print("\nLlamando a Claude Opus 4.6...")
    t0 = time.perf_counter()
    try:
        diagnosis, usage = call_claude(payload)
    except anthropic.AuthenticationError:
        print("Error: ANTHROPIC_API_KEY inválida o sin permisos para el modelo.")
        sys.exit(1)
    except anthropic.RateLimitError:
        print("Error: rate limit de Anthropic alcanzado. Esperá unos minutos y reintentá.")
        sys.exit(1)
    except anthropic.APIConnectionError as exc:
        print(f"Error de conexión con la API de Anthropic: {exc}")
        sys.exit(1)
    except anthropic.APIError as exc:
        print(f"Error de la API de Anthropic ({type(exc).__name__}): {exc}")
        sys.exit(1)
    elapsed = time.perf_counter() - t0

    # 7. Mostrar resultados
    sep = "=" * 60
    print("\n" + sep)
    print("DIAGNOSTICO AUTOMATICO")
    print(sep)
    print(diagnosis)
    print(sep)

    input_tok = getattr(usage, "input_tokens", 0) or 0
    output_tok = getattr(usage, "output_tokens", 0) or 0
    cache_write = getattr(usage, "cache_creation_input_tokens", 0) or 0
    cache_read = getattr(usage, "cache_read_input_tokens", 0) or 0
    cost = compute_cost(usage)

    print(
        f"\nTokens — input: {input_tok} | output: {output_tok}"
        f" | cache_write: {cache_write} | cache_read: {cache_read}"
    )
    print(f"Costo estimado: ${cost:.6f} USD")
    print(f"Tiempo de llamada: {elapsed:.2f}s")


if __name__ == "__main__":
    main()
