"""Test script para validar la lógica de despacho del prompt de IA.

Usa el payload real del log BRBST2900Q (jun-2026) para iterar sobre el prompt
sin necesidad de pasar por la UI.

Uso (desde la raíz del repo):
    python backend/scripts/test_despacho.py
"""

from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(_REPO_ROOT))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from dotenv import load_dotenv
load_dotenv(_REPO_ROOT / ".env")

import os
api_key = os.getenv("ANTHROPIC_API_KEY")
if not api_key:
    print("Error: ANTHROPIC_API_KEY no definida en .env")
    sys.exit(1)

from backend.application.services.ai_diagnosis_service import SYSTEM_PROMPT, call_claude, compute_cost  # noqa: E402

# ---------------------------------------------------------------------------
# Payload basado en el log real BRBST2900Q (may–jun 2026)
# counter_range del log completo: [0, 92500]
# ---------------------------------------------------------------------------
PAYLOAD = {
    "global_severity": "ERROR",
    "metadata": {
        "serial_number": "BRBST2900Q",
        "model_name": "HP LaserJet Enterprise E52645dn",
        "firmware": "2509087_000073",
        "date_range": "21-may-2026 – 09-jun-2026",
        "counter_range": [0, 92500],
        "total_events": 280,
        "consumables": [
            {"name": "Black Toner", "level_percent": 26, "days_remaining": 46}
        ],
    },
    "incidents": [
        {
            "code": "13.B9.D2",
            "description": "Fuser delivery delay jam.",
            "severity": "ERROR",
            "occurrences": 9,
            "start": "2026-06-05T05:31:50",
            "end": "2026-06-06T06:35:15",
            "counter_range": [91715, 91972],
            "pattern": "Rachas de hasta 4 eventos en 2 días",
        },
        {
            "code": "13.B9.D1",
            "description": "Fuser delivery delay jam.",
            "severity": "ERROR",
            "occurrences": 2,
            "start": "2026-05-21T06:40:17",
            "end": "2026-06-08T07:47:43",
            "counter_range": [88508, 92055],
            "pattern": "2 eventos distribuidos en 18 días",
        },
        {
            "code": "41.03.E2",
            "description": "Errors in the 41.* family are related to printing problems, such as a mismatch between the paper that is in the printer and the paper the printer is configured to use.",
            "severity": "ERROR",
            "occurrences": 4,
            "start": "2026-06-02T14:37:54",
            "end": "2026-06-08T16:38:22",
            "counter_range": [91134, 92123],
            "pattern": "4 eventos distribuidos en 6 días",
        },
        {
            "code": "13.B9.A2",
            "description": "Fuser delivery stay jam.",
            "severity": "ERROR",
            "occurrences": 1,
            "start": "2026-06-05T05:39:01",
            "end": "2026-06-05T05:39:01",
            "counter_range": [91716, 91716],
            "pattern": "1 evento aislado",
        },
        {
            "code": "41.03.01",
            "description": "The printer detected a different paper size than expected.",
            "severity": "ERROR",
            "occurrences": 2,
            "start": "2026-06-03T07:54:31",
            "end": "2026-06-03T07:54:33",
            "counter_range": [91321, 91321],
            "pattern": "2 eventos en 1 minuto",
        },
        {
            "code": "98.00.07",
            "description": "Errors in the 98.* family are related to data corruption in the firmware.",
            "severity": "INFO",
            "occurrences": 3,
            "start": "2026-05-11T12:34:40",
            "end": "2026-06-04T17:57:37",
            "counter_range": [86373, 91624],
            "pattern": "3 eventos distribuidos en 24 días",
        },
        {
            "code": "33.27.01",
            "description": "Errors in the 33.* family are related to the printer's storage system or the formatter.",
            "severity": "INFO",
            "occurrences": 6,
            "start": "2026-05-15T20:06:31",
            "end": "2026-05-29T20:10:05",
            "counter_range": [87590, 90437],
            "pattern": "6 eventos distribuidos en 14 días",
        },
    ],
}


async def main() -> None:
    print("Llamando a Claude con el prompt actual...")
    print(f"Log max counter: {PAYLOAD['metadata']['counter_range'][1]}")
    print()

    for inc in PAYLOAD["incidents"]:
        cr = inc.get("counter_range", [0, 0])
        delta = PAYLOAD["metadata"]["counter_range"][1] - cr[1]
        status = "CRÍTICO" if delta < 100 else "MODERADO" if delta <= 400 else "RESUELTO"
        print(f"  {inc['code']:15s} counter_max={cr[1]:6d}  delta={delta:5d}  → {status}")

    print()

    text, tokens = await call_claude(PAYLOAD, api_key)
    cost = compute_cost(tokens)

    try:
        parsed = json.loads(text)
        print("=" * 60)
        print(f"  despacho   : {parsed.get('despacho', '???')}")
        print(f"  motivo     : {parsed.get('despacho_motivo', '???')}")
        print(f"  urgencia   : {parsed.get('urgencia', '???')}")
        print(f"  prioridad  : {parsed.get('prioridad', '???')}")
        print("=" * 60)
        print(f"\nDIAGNOSTICO:\n{parsed.get('diagnostico', '')}")
        print(f"\nTAREAS:\n{parsed.get('tareas_resumen', '')}")
        print(f"\nACCIONES:")
        for i, a in enumerate(parsed.get("acciones", []), 1):
            print(f"  {i}. {a}")
    except json.JSONDecodeError:
        print("Raw response:")
        print(text)

    print(f"\nTokens: input={tokens['input']} output={tokens['output']} cache_read={tokens['cache_read']}")
    print(f"Costo: ${cost:.5f} USD")


if __name__ == "__main__":
    asyncio.run(main())
