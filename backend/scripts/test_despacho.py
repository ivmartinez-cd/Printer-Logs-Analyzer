"""Test script para validar la lógica de despacho del prompt de IA.

Cubre los 5 casos necesarios para validar todas las ramas del prompt:
  CASO 1 — Hardware RESUELTO + config ACTIVO     → despacho esperado: remoto
  CASO 2 — Hardware CRÍTICO (delta < 100)         → despacho esperado: si  | urgencia: urgente
  CASO 3 — Hardware MODERADO (delta 100-400)      → despacho esperado: si  | urgencia: programar
  CASO 4 — Solo firmware/config activos           → despacho esperado: remoto
  CASO 5 — Todo RESUELTO                          → despacho esperado: no  | urgencia: monitorear

Uso (desde la raíz del repo):
    python backend/scripts/test_despacho.py
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(_REPO_ROOT))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from dotenv import load_dotenv

load_dotenv(_REPO_ROOT / ".env")

api_key = os.getenv("ANTHROPIC_API_KEY")
if not api_key:
    print("Error: ANTHROPIC_API_KEY no definida en .env")
    sys.exit(1)

from backend.application.services.ai_diagnosis_service import (  # noqa: E402
    SYSTEM_PROMPT,
    call_claude,
    compute_cost,
)

# ---------------------------------------------------------------------------
# Casos de test
# ---------------------------------------------------------------------------

CASES = [
    {
        "name": "CASO 1 — Hardware RESUELTO + config ACTIVO",
        "expected_despacho": "remoto",
        "expected_urgencia": "programar",
        "payload": {
            "global_severity": "ERROR",
            "metadata": {
                "serial_number": "BRBST2900Q",
                "model_name": "HP LaserJet Enterprise E52645dn",
                "counter_range": [0, 92500],
                "date_range": "21-may-2026 – 09-jun-2026",
                "consumables": [{"name": "Black Toner", "level_percent": 26}],
            },
            "incidents": [
                {"code": "13.B9.D2", "description": "Fuser delivery delay jam.", "severity": "ERROR",
                 "occurrences": 9, "start": "2026-06-05T05:31:50", "end": "2026-06-06T06:35:15",
                 "counter_range": [91715, 91972]},
                {"code": "13.B9.D1", "description": "Fuser delivery delay jam.", "severity": "ERROR",
                 "occurrences": 2, "start": "2026-05-21T06:40:17", "end": "2026-06-08T07:47:43",
                 "counter_range": [88508, 92055]},
                {"code": "41.03.E2", "description": "Paper mismatch between tray and printer config.",
                 "severity": "ERROR", "occurrences": 4, "start": "2026-06-02T14:37:54",
                 "end": "2026-06-08T16:38:22", "counter_range": [91134, 92123]},
            ],
        },
    },
    {
        "name": "CASO 2 — Hardware CRÍTICO (delta < 100)",
        "expected_despacho": "si",
        "expected_urgencia": "urgente",
        "payload": {
            "global_severity": "ERROR",
            "metadata": {
                "serial_number": "TEST002",
                "model_name": "HP LaserJet Enterprise M608dn",
                "counter_range": [0, 50100],
                "date_range": "01-jun-2026 – 10-jun-2026",
            },
            "incidents": [
                {"code": "13.20.00", "description": "Jam in paper path — input area.", "severity": "ERROR",
                 "occurrences": 5, "start": "2026-06-09T08:00:00", "end": "2026-06-10T09:00:00",
                 "counter_range": [50020, 50060]},  # delta = 50100-50060 = 40 → CRÍTICO
                {"code": "59.40.00", "description": "Motor error — main drive.", "severity": "ERROR",
                 "occurrences": 2, "start": "2026-06-10T08:00:00", "end": "2026-06-10T09:30:00",
                 "counter_range": [50070, 50085]},  # delta = 50100-50085 = 15 → CRÍTICO
            ],
        },
    },
    {
        "name": "CASO 3 — Hardware MODERADO (delta 100-400)",
        "expected_despacho": "si",
        "expected_urgencia": "programar",
        "payload": {
            "global_severity": "ERROR",
            "metadata": {
                "serial_number": "TEST003",
                "model_name": "HP LaserJet Enterprise M607dn",
                "counter_range": [0, 75000],
                "date_range": "01-jun-2026 – 10-jun-2026",
            },
            "incidents": [
                {"code": "50.3A.00", "description": "Fuser error — high temperature.", "severity": "ERROR",
                 "occurrences": 3, "start": "2026-06-07T10:00:00", "end": "2026-06-08T14:00:00",
                 "counter_range": [74500, 74750]},  # delta = 75000-74750 = 250 → MODERADO
                {"code": "99.07.20", "description": "Firmware upgrade event.", "severity": "INFO",
                 "occurrences": 2, "start": "2026-06-01T09:00:00", "end": "2026-06-01T09:05:00",
                 "counter_range": [70000, 70001]},  # delta = 4999 → RESUELTO
            ],
        },
    },
    {
        "name": "CASO 4 — Solo firmware/config activos (sin hardware físico)",
        "expected_despacho": "remoto",
        "expected_urgencia": "programar",
        "payload": {
            "global_severity": "INFO",
            "metadata": {
                "serial_number": "TEST004",
                "model_name": "HP LaserJet Enterprise M612dn",
                "counter_range": [0, 30000],
                "date_range": "01-jun-2026 – 10-jun-2026",
                "consumables": [{"name": "Black Toner", "level_percent": 8}],
            },
            "incidents": [
                {"code": "10.00.15", "description": "Black cartridge very low.", "severity": "INFO",
                 "occurrences": 3, "start": "2026-06-08T08:00:00", "end": "2026-06-10T10:00:00",
                 "counter_range": [29800, 29950]},  # delta = 50 → CRÍTICO pero es consumible
                {"code": "41.03.01", "description": "Paper size mismatch.", "severity": "ERROR",
                 "occurrences": 2, "start": "2026-06-09T11:00:00", "end": "2026-06-10T09:00:00",
                 "counter_range": [29900, 29980]},  # delta = 20 → CRÍTICO pero es config
                {"code": "98.00.07", "description": "Data corruption in firmware.", "severity": "INFO",
                 "occurrences": 1, "start": "2026-06-05T08:00:00", "end": "2026-06-05T08:00:00",
                 "counter_range": [28500, 28500]},  # delta = 1500 → RESUELTO
            ],
        },
    },
    {
        "name": "CASO 5 — Todo RESUELTO",
        "expected_despacho": "no",
        "expected_urgencia": "monitorear",
        "payload": {
            "global_severity": "INFO",
            "metadata": {
                "serial_number": "TEST005",
                "model_name": "HP LaserJet Enterprise M609dn",
                "counter_range": [0, 120000],
                "date_range": "01-may-2026 – 10-jun-2026",
            },
            "incidents": [
                {"code": "13.B9.D2", "description": "Fuser delivery delay jam.", "severity": "ERROR",
                 "occurrences": 2, "start": "2026-05-01T10:00:00", "end": "2026-05-01T10:30:00",
                 "counter_range": [110000, 110050]},  # delta = 9950 → RESUELTO
                {"code": "41.03.E2", "description": "Paper mismatch.", "severity": "ERROR",
                 "occurrences": 1, "start": "2026-05-15T09:00:00", "end": "2026-05-15T09:00:00",
                 "counter_range": [115000, 115000]},  # delta = 5000 → RESUELTO
                {"code": "99.07.20", "description": "Firmware upgrade event.", "severity": "INFO",
                 "occurrences": 2, "start": "2026-05-10T08:00:00", "end": "2026-05-10T08:05:00",
                 "counter_range": [112000, 112001]},  # delta = 7999 → RESUELTO
            ],
        },
    },
]


# ---------------------------------------------------------------------------
# Runner
# ---------------------------------------------------------------------------

async def run_case(case: dict) -> dict:
    text, tokens = await call_claude(case["payload"], api_key)
    cost = compute_cost(tokens)
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        parsed = {}
    return {"parsed": parsed, "tokens": tokens, "cost": cost}


async def main() -> None:
    results = []
    for case in CASES:
        print(f"\n{'='*60}")
        print(f"  {case['name']}")
        print(f"  Esperado → despacho: {case['expected_despacho']} | urgencia: {case['expected_urgencia']}")
        print(f"{'='*60}")

        result = await run_case(case)
        p = result["parsed"]

        despacho = p.get("despacho", "???")
        urgencia = p.get("urgencia", "???")
        motivo = p.get("despacho_motivo", "")
        hw_deltas = p.get("_hw_deltas", "")
        logica = p.get("_despacho_logica", "")

        ok_despacho = despacho == case["expected_despacho"]
        ok_urgencia = urgencia == case["expected_urgencia"]
        status = "✅ PASS" if (ok_despacho and ok_urgencia) else "❌ FAIL"

        print(f"  {status}")
        d_mark = "✓" if ok_despacho else f"✗ (esperado: {case['expected_despacho']})"
        u_mark = "✓" if ok_urgencia else f"✗ (esperado: {case['expected_urgencia']})"
        print(f"  despacho : {despacho} {d_mark}")
        print(f"  urgencia : {urgencia} {u_mark}")
        print(f"  motivo   : {motivo}")
        print(f"  hw_deltas: {hw_deltas}")
        print(f"  logica   : {logica}")
        print(f"  costo    : ${result['cost']:.5f} USD")

        results.append({**case, "despacho": despacho, "urgencia": urgencia, "pass": ok_despacho and ok_urgencia})

    print(f"\n{'='*60}")
    passed = sum(1 for r in results if r["pass"])
    print(f"  RESULTADO FINAL: {passed}/{len(results)} casos correctos")
    for r in results:
        icon = "✅" if r["pass"] else "❌"
        print(f"  {icon} {r['name']}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    asyncio.run(main())
