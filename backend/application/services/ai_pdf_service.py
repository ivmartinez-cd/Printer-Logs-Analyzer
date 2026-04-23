"""Servicio de generación de resúmenes ejecutivos en PDF usando Claude Haiku vía Anthropic API."""

from __future__ import annotations

import json
import logging
import re
from typing import Any

from anthropic import AsyncAnthropic

_logger = logging.getLogger(__name__)

# Usamos el modelo Haiku 4.5 disponible en la cuenta del usuario para máxima velocidad
MODEL = "claude-haiku-4-5-20251001"

SYSTEM_PROMPT = (
    "Eres un consultor ejecutivo de IT especializado en servicios de impresión gestionados.\n"
    "Tu objetivo es redactar un resumen ejecutivo altamente profesional y conciso que se imprimirá "
    "en la cabecera de un reporte PDF para la gerencia o cliente final.\n\n"
    "DATOS DISPONIBLES:\n"
    "1. Incidentes Críticos y Alertas de la flota o equipo (códigos, frecuencias y descripción).\n"
    "2. Estado de los consumibles (si los hay).\n\n"
    "INSTRUCCIONES:\n"
    "- Redacta un 'narrative_summary' de máximo 4 líneas (aprox. 50-70 palabras) resumiendo el estado general. "
    "No uses lenguaje excesivamente técnico, habla en términos de impacto operativo (ej. 'El equipo requiere intervención').\n"
    "- Determina el 'tone' general del reporte eligiendo UNICAMENTE entre: 'critical' (hay errores graves o consumibles vacíos), "
    "'watch' (hay advertencias que requieren atención pronta), o 'ok' (el equipo opera con normalidad).\n"
    "- Crea un 'action_plan' con exactamente 3 pasos enumerados en orden de prioridad.\n"
    "- Crea un diccionario 'error_translations' traduciendo los códigos principales que vengan en el payload "
    "a una explicación breve de 1 frase enfocada en negocio (ej. '13.B2.FF': 'Atasco frecuente en bandeja 2 por desgaste de rodillos').\n\n"
    "Responde UNICAMENTE con el siguiente JSON estructurado:\n"
    "{\n"
    '  "narrative_summary": "...",\n'
    '  "tone": "critical|watch|ok",\n'
    '  "action_plan": ["Paso 1...", "Paso 2...", "Paso 3..."],\n'
    '  "error_translations": {"CODIGO_1": "explicación", "CODIGO_2": "explicación"}\n'
    "}\n\n"
    "REGLA DE ORO: NO envíes ningún texto fuera del bloque JSON. Formato JSON estricto."
)

def _extract_json(text: str) -> dict | None:
    cleaned = re.sub(r"^```(?:json)?\s*", "", text.strip(), flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned.strip())

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{[\s\S]*\}", cleaned)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    _logger.warning("No se pudo extraer JSON de la respuesta IA (Haiku): %s", text[:200])
    return None

async def generate_pdf_summary(payload: dict[str, Any], api_key: str) -> dict[str, Any]:
    """Genera un resumen ejecutivo vía IA para inyectar en el reporte PDF."""
    client = AsyncAnthropic(api_key=api_key)
    try:
        response = await client.messages.create(
            model=MODEL,
            max_tokens=800,
            system=SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": json.dumps(payload, ensure_ascii=False, indent=2),
                }
            ],
            temperature=0.3, # Baja temperatura para respuestas más deterministas y consistentes
        )
        raw_text = response.content[0].text
        
        parsed = _extract_json(raw_text)
        if not parsed:
            raise ValueError("La IA no devolvió un JSON válido.")
            
        return parsed
    except Exception as e:
        _logger.error("Error al generar resumen ejecutivo PDF con Haiku: %s", str(e))
        raise
