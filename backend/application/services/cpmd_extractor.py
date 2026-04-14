"""Client for extracting structured error solutions from raw CPMD blocks via Claude Haiku.

Public API:
  - extract_solution(block, api_key) → ExtractedSolution | None
"""

from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass
from typing import Dict, List, Optional

from anthropic import Anthropic

from backend.application.services.cpmd_parser import ErrorBlock

_logger = logging.getLogger(__name__)

MODEL = "claude-haiku-4-5-20251001"
_MAX_TOKENS = 1024
_TIMEOUT = 60.0  # seconds per call


# ---------------------------------------------------------------------------
# Data class
# ---------------------------------------------------------------------------


@dataclass
class ExtractedSolution:
    """Structured solution extracted from a raw CPMD block."""

    code: str
    title: str
    cause: str
    technician_steps: List[str]
    frus: List[Dict[str, str]]


# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = (
    "Sos un asistente que extrae información técnica de manuales de servicio "
    "HP (CPMD) para técnicos de impresoras."
)

_USER_PROMPT_TEMPLATE = """\
Te paso el texto crudo de un código de error. Devolvé SOLO un JSON válido \
(sin markdown, sin ```), con esta estructura exacta:

{{
  "code": "string",
  "title": "string corto",
  "cause": "string en español, 1-2 oraciones, técnico y conciso",
  "technician_steps": ["paso 1 en español", "paso 2", ...],
  "frus": [{{"part_number": "string", "description": "string en español"}}]
}}

Reglas:
- "technician_steps": máximo 5 pasos, accionables, en imperativo, en español. \
Omití instrucciones obvias (abrir puerta, etc.) salvo que sean clave. \
Omití referencias a videos.
- "frus": solo si hay part numbers explícitos. Si no hay, devolvé [].
- "cause": qué pasa físicamente, no qué dice el panel.
- No inventes part numbers ni pasos. Si el texto no aporta algo, devolvé \
string vacío o array vacío.

TEXTO CRUDO:
---
{raw_text}
---"""


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def extract_solution(block: ErrorBlock, api_key: str) -> Optional[ExtractedSolution]:
    """Send a block to Claude Haiku and return a structured solution.

    Returns None if the API call fails or the response is not valid JSON
    with the expected shape.  Logs a WARNING in that case.
    No more than one retry attempt is made.
    """
    client = Anthropic(api_key=api_key, timeout=_TIMEOUT)
    raw_response = _call_api(client, block.raw_text)
    if raw_response is None:
        return None

    solution = _parse_response(block.code, raw_response)
    if solution is not None:
        return solution

    # One retry on parse failure
    _logger.info("[cpmd_extractor] Reintentando code=%s", block.code)
    raw_response2 = _call_api(client, block.raw_text)
    if raw_response2 is None:
        return None
    return _parse_response(block.code, raw_response2)


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------


def _call_api(client: Anthropic, raw_text: str) -> Optional[str]:
    """Call the Haiku API and return the raw text response, or None on error."""
    prompt = _USER_PROMPT_TEMPLATE.format(raw_text=raw_text)
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=_MAX_TOKENS,
            system=_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )
    except Exception as exc:
        _logger.warning("[cpmd_extractor] API call failed: %s", exc)
        return None
    return response.content[0].text.strip()


def _strip_markdown_fences(text: str) -> str:
    """Remove surrounding ```json ... ``` or ``` ... ``` fences if present."""
    return re.sub(r"^\s*```(?:json)?\s*\n?(.*?)\n?\s*```\s*$", r"\1", text, flags=re.DOTALL)


def _parse_response(code: str, raw: str) -> Optional[ExtractedSolution]:
    """Parse and validate the JSON response from Haiku.

    Returns None and logs a WARNING if the JSON is invalid or malformed.
    Tolerates:
      - Responses wrapped in markdown ```json ... ``` fences.
      - Responses that are a JSON array instead of an object (uses first element).
    """
    cleaned = _strip_markdown_fences(raw)
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        _logger.warning(
            "[cpmd_extractor] JSON inválido para code=%s: %s",
            code,
            raw[:200],
        )
        return None

    if isinstance(data, list):
        n = len(data)
        if n == 0:
            _logger.warning("[cpmd_extractor] Respuesta como lista vacía para code=%s", code)
            return None
        if n > 1:
            _logger.info(
                "[cpmd_extractor] code=%s devolvió %d variantes, usando la primera", code, n
            )
        data = data[0]

    if not _validate_shape(data):
        _logger.warning(
            "[cpmd_extractor] Shape inválido para code=%s: %s",
            code,
            raw[:200],
        )
        return None

    return ExtractedSolution(
        code=data["code"],
        title=data["title"],
        cause=data["cause"],
        technician_steps=data["technician_steps"],
        frus=data["frus"],
    )


def _validate_shape(data: object) -> bool:
    """Return True if *data* matches the expected ExtractedSolution shape."""
    if not isinstance(data, dict):
        return False
    if not isinstance(data.get("code"), str):
        return False
    if not isinstance(data.get("title"), str):
        return False
    if not isinstance(data.get("cause"), str):
        return False
    steps = data.get("technician_steps")
    if not isinstance(steps, list) or not all(isinstance(s, str) for s in steps):
        return False
    frus = data.get("frus")
    if not isinstance(frus, list):
        return False
    for fru in frus:
        if not isinstance(fru, dict):
            return False
        if not isinstance(fru.get("part_number"), str):
            return False
        if not isinstance(fru.get("description"), str):
            return False
    return True
