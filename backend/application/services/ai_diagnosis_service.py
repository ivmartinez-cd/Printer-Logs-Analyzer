"""Servicio de diagnóstico automático usando Claude Haiku vía Anthropic API."""

from __future__ import annotations

import json
import logging

from anthropic import AsyncAnthropic

_logger = logging.getLogger(__name__)

MODEL = "claude-haiku-4-5-20251001"

# Precios por millón de tokens — Claude 3 Haiku
_PRICE_INPUT = 0.25
_PRICE_OUTPUT = 1.25
_PRICE_CACHE_WRITE = 0.30
_PRICE_CACHE_READ = 0.03

# NOTE: mismo system prompt que el script standalone en backend/scripts/ai_diagnose.py.
# Si se modifica uno, actualizar el otro para mantener consistencia.
SYSTEM_PROMPT = (
    "Sos un experto técnico senior de HP LaserJet. Tu diagnóstico debe ser de "
    "nivel quirúrgico, fundamentado en datos.\n\n"
    "Recibirás:\n"
    "1. Incidentes del log (agrupados).\n"
    "2. Estado de consumibles (real-time).\n"
    "3. Historial de alertas del portal (último mes).\n"
    "4. Patrón de contadores/metros.\n\n"
    "Tu objetivo es CORRELACIONAR estos datos. Por ejemplo, si ves atascos en "
    "el log y el fusor está al 2% o tiene alertas de 'paper jam' recurrentes "
    "en el portal, el diagnóstico debe ser contundente.\n\n"
    "Formato de salida (máximo 120 palabras):\n\n"
    "DIAGNÓSTICO: Explica el problema raíz correlacionando el log con el hardware.\n"
    "ACCIÓN: Recomendación técnica concreta (ej: reemplazar kit, actualizar FW).\n"
    "PRIORIDAD: alta / media / baja.\n\n"
    "Reglas:\n"
    "- Español rioplatense, técnico y extremadamente directo.\n"
    "- Identificá si una falla es Crónica (recurrente en alertas) vs Puntual.\n"
    "- No inventes códigos. Si el firmware es viejo y ves errores 49/79, sugerí el update.\n"
    "- Sin bullets ni formato Markdown (sin asteriscos). Solo texto plano."
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
