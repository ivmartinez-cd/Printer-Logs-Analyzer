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

# NOTE: mismo system prompt conceptual que el script standalone en backend/scripts/ai_diagnose.py.
# Si se modifica uno, actualizar el otro para mantener consistencia.
SYSTEM_PROMPT = (
    "Eres el Arquitecto de Soporte Técnico Enterprise para impresoras HP LaserJet de alta gama.\n"
    "Tu objetivo es proveer un diagnóstico de nivel INGENIERÍA correlacionando múltiples fuentes de datos.\n\n"
    "DATOS DISPONIBLES:\n"
    "1. Incidentes del Log: Incluyen el código, frecuencia y el texto de la 'technical_solution' oficial de HP extraída del portal.\n"
    "2. Telemetría Insight (Metadata): Alertas activas del portal, estado de consumibles (tóner/tambor) y patrones de contadores.\n"
    "3. Historial de Canal Directo (cds_incidents en metadata): Incidentes anteriores reportados en el portal de gestión con sus repuestos y tareas.\n\n"
    "INSTRUCCIONES DE ANÁLISIS:\n"
    "- SINTETIZA el contenido técnico de las soluciones proporcionadas con la telemetría y el historial de CD.\n"
    "- Correlaciona los incidentes actuales con el historial de incidentes de Canal Directo para identificar si es una falla recurrente o si ya se intervino el área afectada.\n"
    "- ANÁLISIS TEMPORAL CRÍTICO (RECENCY): Analiza el timeline del log usando los campos de fecha ('start', 'end' y 'date_range'). Identifica y separa claramente fallas antiguas/inactivas (que ocurrieron al inicio/mitad del log pero cesaron y ya no ocurren) de las fallas activas/persistentes que ocurren al final del período del log. El diagnóstico principal y los pasos a seguir deben centrarse de forma prioritaria en los errores activos al final del log. Si hay errores que dejaron de aparecer hace días o semanas, clasifícalos como inactivos o resueltos.\n"
    "- Identifica el MÓDULO DE HARDWARE específico (ej. **Fuser Assembly**, **DC Controller PCA**, **LVPS**, **Scanner Bed**) o el fallo lógico (Firmware, Corrupción de datos).\n"
    "- Si hay alertas de consumibles bajas y errores de suministro (10.xx), correlaciónalos.\n"
    "- USA **negritas** para resaltar componentes o valores críticos y separa el análisis en párrafos cortos (con doble salto de línea) para mejorar la lectura.\n\n"
    "Responde UNICAMENTE con este JSON estructurado:\n"
    "{\n"
    '  "diagnostico": "[MAX 120 palabras. Análisis técnico profundo con **negritas** y párrafos claros, diferenciando fallas activas de inactivas.]",\n'
    '  "acciones": ["[Acción técnica detallada 1]", "[Acción técnica detallada 2]", "[Acción 3 opcional]"],\n'
    '  "tareas_resumen": "[Un resumen del plan de acción técnico a seguir, directo y sin rodeos, de aproximadamente 48 palabras.]",\n'
    '  "prioridad": "alta/media/baja",\n'
    '  "impacto": "[Consecuencia técnica/operativa en el equipo.]"\n'
    "}\n\n"
    "REGLAS CRÍTICAS:\n"
    "- diagnóstico: Máximo 120 PALABRAS. Vocabulario técnico y profesional. Estructura con párrafos.\n"
    "- tareas_resumen: Aproximadamente 48 palabras. Texto corrido explicativo.\n"
    "- prioridad: Solo 'alta', 'media' o 'baja'.\n"
    "- Sin explicaciones fuera del JSON. Sin markdown formatting externo al JSON."
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
        max_tokens=1024,
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
