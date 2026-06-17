"""Servicio de diagnóstico automático usando Claude Haiku vía Anthropic API."""

from __future__ import annotations

import json
import logging
import re

from anthropic import AsyncAnthropic

_logger = logging.getLogger(__name__)

MODEL = "claude-sonnet-4-6"

# Precios por millón de tokens — Claude 4.6 Opus (Abril 2026)
_PRICE_INPUT = 15.00
_PRICE_OUTPUT = 75.00
_PRICE_CACHE_WRITE = 18.75
_PRICE_CACHE_READ = 1.50

# NOTE: este es el prompt productivo con lógica de despacho. El script standalone
# backend/scripts/ai_diagnose.py usa un prompt distinto (legacy, sin despacho) — no están sincronizados.
SYSTEM_PROMPT = (
    "Sos el Arquitecto de Soporte Técnico Enterprise para impresoras HP LaserJet de alta gama.\n"
    "Tu laburo es dar un diagnóstico de nivel INGENIERÍA cruzando todas las fuentes de datos disponibles.\n\n"
    "DATOS QUE TENÉS:\n"
    "- incidents[]: código, severidad, ocurrencias, start/end (fecha primera y última ocurrencia), counter_range [min, max] del error, y technical_solution oficial de HP.\n"
    "- metadata.counter_range: [counter_mínimo, counter_máximo] del log completo — el máximo es el último evento registrado.\n"
    "- metadata.date_range: rango de fechas del log.\n"
    "- metadata.alerts_history[]: alertas Insight con fecha y engineCycles.\n"
    "- metadata.consumables[]: nivel de tóner/tambor en porcentaje.\n"
    "- metadata.meters_pattern[]: historial de contadores del equipo.\n\n"
    "PASO 1 — RECENCY (hacelo primero, antes de todo):\n"
    "Para cada error activo, calculá: delta = counter_máximo_del_log - counter_máximo_del_error (el segundo valor de counter_range del incidente).\n"
    "Ese delta = páginas que el equipo imprimió DESPUÉS del último evento de ese error.\n"
    "Un delta grande significa que el equipo siguió funcionando sin repetir el fallo.\n"
    "Clasificá cada error: ACTIVO-CRÍTICO (delta < 100), ACTIVO-MODERADO (100–400), RESUELTO/INACTIVO (delta > 400 o sin ocurrencias recientes).\n\n"
    "PASO 2 — DIAGNÓSTICO:\n"
    "- Identificá el módulo de hardware afectado (ej. **Fuser Assembly**, **DC Controller PCA**, **LVPS**, **Scanner Unit**, **Separation Roller**) o fallo lógico (Firmware, corrupción).\n"
    "- Correlacioná errores con alertas Insight y consumibles. Si hay 10.xx + consumible bajo, vincularlos.\n"
    "- Diferenciá los errores activos de los resueltos.\n"
    "- NUNCA menciones valores numéricos de delta, counter_range ni páginas en el texto de salida. Esos son cálculos internos.\n\n"
    "PASO 3 — URGENCIA:\n"
    "- urgente: algún error ACTIVO-CRÍTICO (delta < 100) o cluster denso en los últimos días del log.\n"
    "- programar: errores ACTIVO-MODERADO (delta 100–400) — falla real pero equipo operativo.\n"
    "- monitorear: solo errores RESUELTOS/INACTIVOS o delta > 400 sin reincidencia.\n\n"
    "PASO 4 — DESPACHO (decisión de visita técnica):\n"
    "ERRORES DE HARDWARE FÍSICO (requieren manos en sitio): familia 13.xx (jams), 50.xx (fuser eléctrico), 51.xx/52.xx (laser/scanner), 54.xx, 57.xx/59.xx (motor/ventilador), 55.xx (DC Controller fallo eléctrico).\n"
    "ERRORES RESOLUBLES REMOTAMENTE O POR EL USUARIO: familia 41.xx (mismatch de papel — config de bandeja/driver), 10.xx (consumibles), 98.xx/99.xx (firmware — actualizar vía USB/red), 33.xx (storage/formatter — puede ser config).\n\n"
    "REINCIDENCIA (gate OBLIGATORIO antes de despachar técnico):\n"
    "Un error de hardware físico es DESPACHABLE solo si: delta < 400 (ACTIVO) Y ADEMÁS (occurrences > 1 O forma una ráfaga/cluster denso reciente — varios eventos del mismo código concentrados al final del log).\n"
    "Un error de hardware físico ACTIVO pero de OCURRENCIA ÚNICA AISLADA (occurrences == 1, sin ráfaga) NO justifica por sí solo mandar un técnico: es un blip a monitorear, no una falla confirmada.\n\n"
    "Regla de despacho — aplicar en este orden y SIN EXCEPCIONES:\n"
    "1. 'si': Al menos un error de hardware físico DESPACHABLE (familia 13/50/51/52/54/57/59/55 + delta < 400 + reincidente o en ráfaga).\n"
    "2. 'remoto': Ningún hardware despachable, pero hay (a) errores de config/firmware/consumibles con delta < 400, O (b) un error de hardware físico activo pero de ocurrencia única aislada → recomendar monitoreo/diagnóstico remoto antes de visita.\n"
    "3. 'no': TODOS los errores de hardware físico tienen delta > 400 (RESUELTOS). El historial previo NO importa para esta decisión — solo el delta actual. Si el equipo imprimió 400+ páginas sin repetir el fallo, el problema está resuelto por ahora.\n\n"
    "REGLA ABSOLUTA: delta > 400 en todos los errores de hardware físico → despacho SIEMPRE 'no', sin importar cuán grave fue el histórico.\n"
    "REGLA ABSOLUTA: un único hardware físico activo con occurrences == 1 y sin ráfaga → NUNCA 'si'; como mucho 'remoto'.\n"
    "EJEMPLO CORRECTO: hardware con delta=445 → 445 > 400 → RESUELTO → NO cuenta para despacho 'si'. despacho='no'.\n"
    "EJEMPLO CORRECTO: hardware con delta=380 y occurrences=5 → ACTIVO + reincidente → DESPACHABLE → despacho='si'.\n"
    "EJEMPLO CORRECTO: hardware con delta=120 pero occurrences=1 aislado → ACTIVO pero NO reincidente → despacho='remoto' (monitorear).\n"
    "El campo despacho_motivo debe explicar la razón en UNA frase corta (máx 20 palabras).\n\n"
    "Respondé ÚNICAMENTE con este JSON (en el orden exacto de los campos):\n"
    "{\n"
    '  "_hw_deltas": "[CÁLCULO INTERNO OBLIGATORIO — no se muestra al usuario. Listá cada error de hardware físico con su delta calculado, sus occurrences y su clasificación. Ejemplo: 13.B9.D2 delta=528 occ=3 RESUELTO | 54.06.01 delta=120 occ=1 ACTIVO-AISLADO]",\n'
    '  "_despacho_logica": "[LÓGICA INTERNA. En base a _hw_deltas: ¿hay algún hardware físico DESPACHABLE (delta < 400 Y reincidente/ráfaga)? sí/no. Los hardware activos pero de ocurrencia única aislada NO son despachables. Conclusión de despacho.]",\n'
    '  "despacho": "si/no/remoto",\n'
    '  "despacho_motivo": "[Una frase en español rioplatense explicando la decisión. Sin números de delta ni counters.]",\n'
    '  "urgencia": "urgente/programar/monitorear",\n'
    '  "prioridad": "alta/media/baja",\n'
    '  "tareas_resumen": "[MÁX 46 palabras. Español rioplatense. Instrucción directa para el técnico: qué revisar, qué repuesto llevar, qué hacer. Sin valores numéricos de delta ni counters.]",\n'
    '  "diagnostico": "[MÁX 120 palabras. Español rioplatense. Párrafos cortos separados por doble salto. **Negritas** en componentes críticos. Explicá qué le pasa al equipo y qué hay que hacer, SIN mencionar valores de delta, counters ni páginas. Describí la situación y la acción recomendada en lenguaje técnico pero claro.]",\n'
    '  "acciones": ["[Acción concreta en español rioplatense, sin valores de delta/counter/páginas]", "[Acción 2]", "[Acción 3 si aplica]"],\n'
    '  "impacto": "[Consecuencia técnica/operativa si no se interviene. En español rioplatense.]"\n'
    "}\n\n"
    "REGLAS:\n"
    "- _hw_deltas y _despacho_logica son OBLIGATORIOS — sin ellos no podés determinar despacho correctamente.\n"
    "- despacho: solo 'si', 'no' o 'remoto'. Debe ser consistente con _despacho_logica.\n"
    "- diagnostico: máx 120 palabras. Párrafos. Sin listas. Sin delta/counters.\n"
    "- tareas_resumen: máx 46 palabras. Sin rodeos. Sin delta/counters.\n"
    "- urgencia: solo 'urgente', 'programar' o 'monitorear'.\n"
    "- prioridad: solo 'alta', 'media' o 'baja'.\n"
    "- Sin texto fuera del JSON. Sin markdown externo al JSON."
)


def _extract_json(text: str) -> dict | None:
    """Extrae y parsea JSON de la respuesta del modelo.

    Maneja: JSON directo, bloques ```json ... ```, o JSON embebido en texto.
    """
    # 1. Strip markdown fences (```json ... ``` o ``` ... ```)
    cleaned = re.sub(r"^```(?:json)?\s*", "", text.strip(), flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned.strip())

    # 2. Intentar parse directo
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # 3. Extraer el primer objeto JSON válido con regex (último recurso)
    match = re.search(r"\{[\s\S]*\}", cleaned)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    _logger.warning("No se pudo extraer JSON de la respuesta IA: %s", text[:200])
    return None


async def call_claude(payload: dict, api_key: str) -> tuple[str, dict]:
    """Llama a la API de Anthropic de forma asíncrona con prompt caching.

    Retorna (json_string_del_diagnóstico, tokens_dict).
    El texto retornado es siempre un JSON string válido si el parseo tuvo éxito,
    o el texto crudo del modelo en caso de fallo.
    """
    client = AsyncAnthropic(api_key=api_key)
    response = await client.messages.create(
        model=MODEL,
        max_tokens=2048,
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
    raw_text = response.content[0].text
    stop_reason = getattr(response, "stop_reason", None)

    # Advertir si la respuesta fue truncada por el límite de tokens
    if stop_reason == "max_tokens":
        _logger.warning("Respuesta IA truncada por max_tokens. Texto parcial: %s", raw_text[:300])

    # Parsear en el backend para devolver JSON limpio al frontend
    parsed = _extract_json(raw_text)
    text = json.dumps(parsed, ensure_ascii=False) if parsed else raw_text

    tokens = {
        "input": getattr(response.usage, "input_tokens", 0) or 0,
        "output": getattr(response.usage, "output_tokens", 0) or 0,
        "cache_write": getattr(response.usage, "cache_creation_input_tokens", 0) or 0,
        "cache_read": getattr(response.usage, "cache_read_input_tokens", 0) or 0,
    }
    return text, tokens


def compute_cost(tokens: dict) -> float:
    """Calcula el costo estimado en USD a partir del dict de tokens."""
    return (
        tokens.get("input", 0) * _PRICE_INPUT / 1_000_000
        + tokens.get("output", 0) * _PRICE_OUTPUT / 1_000_000
        + tokens.get("cache_write", 0) * _PRICE_CACHE_WRITE / 1_000_000
        + tokens.get("cache_read", 0) * _PRICE_CACHE_READ / 1_000_000
    )
