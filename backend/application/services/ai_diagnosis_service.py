"""Servicio de diagnóstico automático usando Claude Haiku vía Anthropic API."""

from __future__ import annotations

import json
import logging

from anthropic import AsyncAnthropic

_logger = logging.getLogger(__name__)

MODEL = "claude-3-haiku-20240307"

# Precios por millón de tokens — Claude 3 Haiku
_PRICE_INPUT = 0.25
_PRICE_OUTPUT = 1.25
_PRICE_CACHE_WRITE = 0.30
_PRICE_CACHE_READ = 0.03

# NOTE: mismo system prompt que el script standalone en backend/scripts/ai_diagnose.py.
# Si se modifica uno, actualizar el otro para mantener consistencia.
SYSTEM_PROMPT = (
    "Sos un técnico de impresoras HP LaserJet Enterprise. Recibís un análisis "
    "agrupado de eventos del log y generás un diagnóstico breve para el "
    "operador de servicio.\n\n"
    "Formato de salida (máximo 100 palabras):\n\n"
    "DIAGNÓSTICO: 1-2 oraciones con el problema principal y patrón clave.\n"
    "ACCIÓN: una línea con la recomendación concreta.\n"
    "PRIORIDAD: alta / media / baja.\n\n"
    "Reglas:\n"
    "- Español rioplatense, técnico y directo\n"
    "- Mencioná correlaciones temporales solo si son claras y accionables\n"
    "- No inventes códigos ni descripciones fuera de los datos\n"
    "- Sin bullets ni secciones extra\n"
    "- No uses formato Markdown (sin asteriscos, sin ##, sin bullets). "
    "Solo texto plano con las etiquetas DIAGNÓSTICO:, ACCIÓN:, PRIORIDAD: "
    "seguidas de dos puntos al inicio de cada línea."
)


async def call_claude(payload: dict, api_key: str) -> tuple[str, dict]:
    """Llama a la API de Anthropic de forma asíncrona con prompt caching.

    Retorna (texto_diagnóstico, tokens_dict).
    """
    client = AsyncAnthropic(api_key=api_key)
    response = await client.messages.create(
        model=MODEL,
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
