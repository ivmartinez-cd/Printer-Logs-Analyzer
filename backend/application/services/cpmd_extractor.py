"""Client for extracting structured error solutions from raw CPMD blocks via Claude Haiku.

Used only as a fallback for blocks that score below the confidence threshold
in `cpmd_structured_extractor`.  The LLM is never called for high-confidence
blocks, keeping token consumption as low as possible.

Public API:
  - extract_solution(block, api_key) → ExtractedSolution | None   (single block)
  - extract_batch(blocks, api_key)   → List[ExtractedSolution]    (batch — 1 API call)
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
_MAX_TOKENS_BATCH = 8192  # batch calls can produce more output
_TIMEOUT = 60.0  # seconds per call
_BATCH_SIZE = 20  # max blocks per batch API call (token budget)


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
    """Send a single block to Claude Haiku and return a structured solution.

    Kept for backwards-compatibility and targeted use.  Prefer `extract_batch`
    when processing more than one block simultaneously.

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


def extract_batch(blocks: List[ErrorBlock], api_key: str) -> List[ExtractedSolution]:
    """Send multiple blocks to Haiku in a **single** API call and return solutions.

    Blocks are chunked into groups of at most ``_BATCH_SIZE`` to stay within
    the model's token budget.  Each chunk emits exactly one API call, so
    processing 60 low-confidence blocks costs 3 calls instead of 60.

    Any block that fails to parse is silently dropped (logged as WARNING).
    """
    if not blocks:
        return []

    client = Anthropic(api_key=api_key, timeout=_TIMEOUT * 2)
    solutions: List[ExtractedSolution] = []

    chunks = [blocks[i : i + _BATCH_SIZE] for i in range(0, len(blocks), _BATCH_SIZE)]
    _logger.info(
        "[cpmd_extractor] Batch LLM: %d bloques → %d chunk(s)",
        len(blocks),
        len(chunks),
    )

    for chunk_idx, chunk in enumerate(chunks, start=1):
        raw = _call_batch_api(client, chunk)
        if raw is None:
            _logger.warning(
                "[cpmd_extractor] Chunk %d/%d falló completamente",
                chunk_idx,
                len(chunks),
            )
            continue

        parsed = _parse_batch_response(chunk, raw)
        solutions.extend(parsed)
        _logger.info(
            "[cpmd_extractor] Chunk %d/%d: %d/%d bloques parseados",
            chunk_idx,
            len(chunks),
            len(parsed),
            len(chunk),
        )

    return solutions


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


# ---------------------------------------------------------------------------
# Batch helpers
# ---------------------------------------------------------------------------

_BATCH_SYSTEM_PROMPT = (
    "Sos un asistente que extrae información técnica de manuales de servicio "
    "HP (CPMD) para técnicos de impresoras."
)

_BATCH_USER_TEMPLATE = """\
Te paso {n} bloques de error de un CPMD HP. Devolvé SOLO un JSON array válido \
(sin markdown, sin ```) con exactamente {n} objetos, uno por bloque, en el \
mismo orden que los recibís. Cada objeto debe tener esta estructura:

{{
  "code": "string",
  "title": "string corto",
  "cause": "string en español, 1-2 oraciones, técnico y conciso",
  "technician_steps": ["paso 1 en español", "paso 2", ...],
  "frus": [{{"part_number": "string", "description": "string en español"}}]
}}

Reglas:
- "technician_steps": máximo 5 pasos, accionables, en imperativo, en español.
- "frus": solo si hay part numbers explícitos. Si no hay, devolvé [].
- "cause": qué pasa físicamente, no qué dice el panel.
- No inventes part numbers ni pasos.

BLOQUES:
{blocks_text}"""


def _call_batch_api(client: Anthropic, blocks: List[ErrorBlock]) -> Optional[str]:
    """Send a batch of blocks to Haiku in one message. Returns raw text or None."""
    blocks_text_parts = []
    for i, block in enumerate(blocks, start=1):
        blocks_text_parts.append(f"[BLOQUE {i} — {block.code}]\n{block.raw_text}\n")
    blocks_text = "\n".join(blocks_text_parts)

    prompt = _BATCH_USER_TEMPLATE.format(
        n=len(blocks),
        blocks_text=blocks_text,
    )
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=_MAX_TOKENS_BATCH,
            system=_BATCH_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )
    except Exception as exc:
        _logger.warning("[cpmd_extractor] Batch API call failed: %s", exc)
        return None
    return response.content[0].text.strip()


def _parse_batch_response(blocks: List[ErrorBlock], raw: str) -> List[ExtractedSolution]:
    """Parse a batch Haiku response (JSON array) into ExtractedSolution objects.

    Tolerates markdown fences and partial failures: any invalid item is
    skipped and logged individually.
    """
    cleaned = _strip_markdown_fences(raw)
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        _logger.warning(
            "[cpmd_extractor] Batch: JSON inválido (primeros 300 chars): %s",
            raw[:300],
        )
        return []

    if not isinstance(data, list):
        _logger.warning("[cpmd_extractor] Batch: la respuesta no es un array JSON: %s", raw[:200])
        return []

    solutions: List[ExtractedSolution] = []
    for i, item in enumerate(data):
        # Map to the corresponding block's code if the model omits it
        code = blocks[i].code if i < len(blocks) else f"UNKNOWN_{i}"
        if not isinstance(item, dict):
            _logger.warning("[cpmd_extractor] Batch item %d no es dict (code=%s)", i, code)
            continue
        # Ensure code is set correctly (model might use a different casing)
        item.setdefault("code", code)
        if not _validate_shape(item):
            _logger.warning(
                "[cpmd_extractor] Batch item %d shape inválido (code=%s): %s",
                i,
                code,
                str(item)[:150],
            )
            continue
        solutions.append(
            ExtractedSolution(
                code=item["code"],
                title=item["title"],
                cause=item["cause"],
                technician_steps=item["technician_steps"],
                frus=item["frus"],
            )
        )

    return solutions
