"""Extract printer model data from a Service Cost Data PDF using the Claude API."""

from __future__ import annotations

import base64
import json
import logging
import re

from anthropic import AsyncAnthropic

_logger = logging.getLogger(__name__)

# NOTE: Using claude-haiku-4-5-20251001 for cost reduction on PDF extraction.
MODEL = "claude-haiku-4-5-20251001"

SYSTEM_PROMPT = (
    "Sos un extractor de datos de Service Cost Data de impresoras HP.\n"
    "Recibís un PDF y devolvés SOLO un JSON válido (sin markdown, sin texto explicativo) "
    "con la estructura especificada.\n\n"
    "Para cada submodelo cubierto por el PDF:\n"
    "- Extraé model_name completo (ej. 'HP LaserJet Managed E60055'), "
    "model_code corto (ej. 'E60055'), family si corresponde (ej. 'E600xx'), "
    "ampv (volumen mensual promedio en páginas), engine_life_pages.\n"
    "- Para cada consumible y parte de mantenimiento listada, extraé "
    "part_number, sku, description, life_pages, mttr_minutes, voltage si aplica.\n"
    "- Clasificá cada consumible en una de estas categories: "
    "roller, fuser, toner, transfer, maintenance_kit, other.\n"
    "- Inferí related_codes (códigos de error HP que indicarían el reemplazo de ese consumible):\n"
    "  * Rollers de bandejas → [\"53.B0.0z\", \"53.B1.0z\", \"60.0N.0z\"] "
    "donde N es el número de bandeja\n"
    "  * Fuser / Maintenance kit → [\"13.B9.0z\", \"50.0z.0z\"]\n"
    "  * Toner → [\"10.00.0z\"]\n"
    "  * Si no hay relación clara, array vacío.\n\n"
    "Si un dato no aparece en el PDF, usar null (nunca omitir la key).\n\n"
    "Estructura de respuesta:\n"
    "{\n"
    '  "models": [\n'
    "    {\n"
    '      "model_name": "HP LaserJet Managed E60055",\n'
    '      "model_code": "E60055",\n'
    '      "family": "E600xx",\n'
    '      "ampv": 3500,\n'
    '      "engine_life_pages": 1350000,\n'
    '      "notes": null,\n'
    '      "consumables": [\n'
    "        {\n"
    '          "part_number": "J8J70-67903",\n'
    '          "sku": "J8J70A",\n'
    '          "description": "Tray 1 roller kit",\n'
    '          "category": "roller",\n'
    '          "life_pages": 150000,\n'
    '          "mttr_minutes": 10,\n'
    '          "voltage": null,\n'
    '          "related_codes": ["53.B0.0z", "53.B1.0z"]\n'
    "        }\n"
    "      ]\n"
    "    }\n"
    "  ]\n"
    "}\n\n"
    "Devolvé EXCLUSIVAMENTE JSON válido. Cero markdown. Cero explicación."
)


async def extract_model_from_pdf(pdf_bytes: bytes, api_key: str) -> dict:
    """Call the Claude API with a PDF document and return parsed model data.

    Returns a dict with a 'models' key (list of model dicts).
    Raises ValueError if Claude returns invalid or unexpected JSON.
    """
    client = AsyncAnthropic(api_key=api_key)
    pdf_b64 = base64.standard_b64encode(pdf_bytes).decode("utf-8")

    response = await client.messages.create(
        model=MODEL,
        max_tokens=16000,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "document",
                        "source": {
                            "type": "base64",
                            "media_type": "application/pdf",
                            "data": pdf_b64,
                        },
                    },
                    {
                        "type": "text",
                        "text": "Extraé los datos del PDF y devolvé solo el JSON con la estructura especificada.",
                    },
                ],
            }
        ],
    )

    raw = response.content[0].text.strip()
    stop_reason = response.stop_reason
    _logger.debug("Claude response length: %d chars, stop_reason: %s", len(raw), stop_reason)
    if stop_reason == "max_tokens":
        raise ValueError(
            "Respuesta truncada por max_tokens, aumentá el límite o dividí el PDF"
        )
    if stop_reason != "end_turn":
        _logger.warning("Claude stop_reason inesperado: %s", stop_reason)

    # Strip markdown fences that Claude might accidentally include.
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    raw = raw.strip()

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Claude devolvió JSON inválido: {raw[:500]}") from exc

    if "models" not in data or not isinstance(data["models"], list):
        raise ValueError(
            f"La respuesta no contiene el campo 'models' como array: {raw[:500]}"
        )

    return data
