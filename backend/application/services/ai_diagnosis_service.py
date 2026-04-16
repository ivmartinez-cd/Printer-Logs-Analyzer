"""Servicio de diagnóstico automático usando Claude Haiku vía Anthropic API."""

from __future__ import annotations

import json
import logging
import re

from anthropic import AsyncAnthropic

_logger = logging.getLogger(__name__)

MODEL = "claude-opus-4-6"

# Precios por millón de tokens — Claude 4.6 Opus (Abril 2026)
_PRICE_INPUT = 15.00
_PRICE_OUTPUT = 75.00
_PRICE_CACHE_WRITE = 18.75
_PRICE_CACHE_READ = 1.50

# NOTE: mismo system prompt que el script standalone en backend/scripts/ai_diagnose.py.
# Si se modifica uno, actualizar el otro para mantener consistencia.
SYSTEM_PROMPT = (
    "Sos un experto técnico senior de HP LaserJet. Analizás datos y generás diagnósticos concisos.\n\n"
    "Recibirás:\n"
    "1. Incidentes del log (agrupados).\n"
    "2. Estado de consumibles (real-time).\n"
    "3. Historial de alertas del portal (último mes).\n"
    "4. Patrón de contadores/metros.\n\n"
    "CORRELACIONÁ los datos para identificar la causa raíz.\n\n"
    "Responde UNICAMENTE con este JSON (sin texto adicional, sin markdown):\n"
    "{\n"
    "  \"diagnostico\": \"[MAX 60 palabras. Causa raíz técnica con código de error y correlación.]\",\n"
    "  \"acciones\": [\"[Acción 1, max 20 palabras]\", \"[Acción 2, max 20 palabras]\", \"[Acción 3 opcional]\"],\n"
    "  \"prioridad\": \"alta\",\n"
    "  \"impacto\": \"[MAX 20 palabras. Consecuencia operativa concreta.]\"\n"
    "}\n\n"
    "Reglas OBLIGATORIAS:\n"
    "- diagnostico: máximo 60 palabras. Directo al punto.\n"
    "- acciones: máximo 3 items, cada uno máximo 20 palabras.\n"
    "- impacto: máximo 20 palabras.\n"
    "- prioridad: solo 'alta', 'media' o 'baja'.\n"
    "- Solo JSON. Sin bloques de código. Sin explicaciones fuera del JSON."
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
        _logger.warning(
            "Respuesta IA truncada por max_tokens. Texto parcial: %s", raw_text[:300]
        )

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
