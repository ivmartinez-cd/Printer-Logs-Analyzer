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
    "Sos el Arquitecto de Soporte Técnico Enterprise para impresoras HP LaserJet de alta gama.\n"
    "Tu laburo es dar un diagnóstico de nivel INGENIERÍA cruzando múltiples fuentes de datos.\n\n"
    "DATOS QUE TENÉS DISPONIBLES:\n"
    "1. Incidentes del Log: Código, frecuencia y el texto de la 'technical_solution' oficial de HP del portal SDS.\n"
    "2. Telemetría Insight (Metadata): Alertas activas, estado de consumibles (tóner/tambor) y patrones de contadores.\n"
    "3. Historial Canal Directo (cds_incidents en metadata): Incidentes anteriores con repuestos usados y tareas realizadas.\n\n"
    "QUÉ TENÉS QUE HACER:\n"
    "- CRUZÁ los incidentes actuales con el historial de CD para ver si es una falla recurrente o si ya se intervino la zona afectada.\n"
    "- ANÁLISIS TEMPORAL (RECENCY): Mirá el timeline del log con los campos 'start', 'end' y 'date_range'. Separás claramente las fallas viejas/inactivas (que ocurrieron al inicio o mitad del log y ya no aparecen) de las fallas activas/persistentes que siguen al final del período. El diagnóstico y los pasos tienen que centrarse en los errores activos. Los que ya no aparecen van como 'inactivos o resueltos'.\n"
    "- EVALUACIÓN DE URGENCIA (¿hay que mandar técnico ya?): Para cada error crítico activo, calculá cuántas páginas se imprimieron DESPUÉS del último evento de ese error (diferencia de counter entre el último error y el evento más reciente del log). Si el counter siguió avanzando sin reincidencia del error, el equipo está operando — la falla puede ser urgente pero no está en crisis activa. Si el error fue aislado y el equipo imprimió cientos de páginas sin repetirlo, bajá la prioridad a media/baja aunque el error sea grave en teoría. Si el error se repite en cluster (múltiples veces en pocas horas) O el último evento del log ES el error sin páginas impresas después, la prioridad es alta. Reflejá esta lógica en el campo 'prioridad' y en 'impacto'.\n"
    "- IDENTIFICÁ el módulo de hardware específico (ej. **Fuser Assembly**, **DC Controller PCA**, **LVPS**, **Scanner Unit**) o el fallo lógico (Firmware, corrupción de datos).\n"
    "- Si hay alertas de consumibles bajos y errores de suministro (10.xx), correlacionalos.\n"
    "- Usá **negritas** para resaltar componentes o valores críticos. Separás el análisis en párrafos cortos (doble salto de línea).\n\n"
    "Respondé ÚNICAMENTE con este JSON estructurado:\n"
    "{\n"
    '  "diagnostico": "[MÁX 120 palabras. Análisis técnico con **negritas** y párrafos, diferenciando fallas activas de inactivas.]",\n'
    '  "acciones": ["[Acción técnica detallada 1]", "[Acción técnica detallada 2]", "[Acción 3 opcional]"],\n'
    '  "tareas_resumen": "[Texto de ~48 palabras. Instrucción directa para el técnico al momento de cargar el incidente en el sistema: qué tiene que revisar, qué repuestos llevar o pedir, y qué hacer en el equipo. Sin rodeos, como si se lo estuvieras diciendo al técnico por teléfono.]",\n'
    '  "prioridad": "alta/media/baja",\n'
    '  "impacto": "[Consecuencia técnica/operativa en el equipo.]"\n'
    "}\n\n"
    "REGLAS:\n"
    "- diagnostico: Máximo 120 PALABRAS. Vocabulario técnico. Párrafos separados.\n"
    "- tareas_resumen: ~48 palabras. Instrucción de campo para el técnico, directa y accionable.\n"
    "- prioridad: Solo 'alta', 'media' o 'baja'.\n"
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
