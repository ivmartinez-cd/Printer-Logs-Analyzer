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

# NOTE: mismo system prompt que el script standalone en backend/scripts/ai_diagnose.py.
# Si se modifica uno, actualizar el otro para mantener consistencia.
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
    "- Diferenciá explícitamente los errores activos de los inactivos/resueltos.\n"
    "- Mencioná el delta calculado para los errores críticos.\n\n"
    "PASO 3 — URGENCIA:\n"
    "- urgente: algún error ACTIVO-CRÍTICO (delta < 100) o cluster denso en los últimos días del log.\n"
    "- programar: errores ACTIVO-MODERADO (delta 100–400) — falla real pero equipo operativo.\n"
    "- monitorear: solo errores RESUELTOS/INACTIVOS o delta > 400 sin reincidencia.\n\n"
    "PASO 4 — DESPACHO (decisión de visita técnica):\n"
    "Usá la clasificación de recency del PASO 1. Reglas en orden de precedencia:\n"
    "- 'si': Existe al menos un error de hardware físico (jam, fuser, mecanismo) clasificado como ACTIVO-CRÍTICO (delta < 100) O ACTIVO-MODERADO (delta 100–400) con patrón de reincidencia en los últimos 3 días del log.\n"
    "- 'remoto': No hay hardware físico activo, pero hay errores de firmware/config/consumibles activos (delta < 400) que el usuario o soporte remoto puede resolver.\n"
    "- 'no': TODOS los errores de hardware físico son RESUELTOS/INACTIVOS (delta > 400). El equipo sigue operativo sin repetición del fallo. Aunque el error pasado fuera grave, si no repite → no se justifica visita ahora.\n"
    "IMPORTANTE: Un jam que ocurrió hace 4+ días y no volvió a repetirse tiene delta > 400 → clasificar RESUELTO → despacho 'no', aunque sea un error de hardware severo.\n"
    "El campo despacho_motivo debe explicar la razón en UNA frase corta (máx 20 palabras).\n\n"
    "Respondé ÚNICAMENTE con este JSON:\n"
    "{\n"
    '  "diagnostico": "[MÁX 120 palabras. Párrafos cortos separados por doble salto. **Negritas** en componentes críticos. Mencioná delta del error más reciente y si el equipo está operativo hoy.]",\n'
    '  "acciones": ["[Acción concreta 1]", "[Acción concreta 2]", "[Acción 3 si aplica]"],\n'
    '  "tareas_resumen": "[MÁX 46 palabras. Instrucción directa para cargar en el incidente: qué revisar, qué repuesto llevar, qué hacer en sitio. Como si se lo dijeras al técnico por teléfono.]",\n'
    '  "urgencia": "urgente/programar/monitorear",\n'
    '  "despacho": "si/no/remoto",\n'
    '  "despacho_motivo": "[Una frase. Por qué sí/no/remoto.]",\n'
    '  "prioridad": "alta/media/baja",\n'
    '  "impacto": "[Consecuencia técnica/operativa si no se interviene.]"\n'
    "}\n\n"
    "REGLAS:\n"
    "- diagnostico: máx 120 palabras. Párrafos. Sin listas dentro del campo.\n"
    "- tareas_resumen: máx 46 palabras. Sin rodeos. Accionable.\n"
    "- urgencia: solo 'urgente', 'programar' o 'monitorear'.\n"
    "- despacho: solo 'si', 'no' o 'remoto'.\n"
    "- despacho_motivo: máx 20 palabras.\n"
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
