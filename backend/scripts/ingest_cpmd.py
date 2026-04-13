"""CLI script to ingest a CPMD PDF for a printer model, writing directly to the DB.

Bypass para el endpoint POST /models/{id}/cpmd que da 502 en Render free por
timeout (5-10 min por CPMD). Este script corre en la máquina local y escribe
directamente en la DB de producción (Neon) usando los mismos servicios.

Usage:
  python -m backend.scripts.ingest_cpmd --model-id <uuid> --pdf <path>
  python -m backend.scripts.ingest_cpmd --model-id <uuid> --pdf <path> --dry-run
"""

from __future__ import annotations

import argparse
import logging
import os
import sys
import time
from pathlib import Path
from uuid import UUID

# Log to stdout so cpmd_ingest progress lines appear in the terminal
logging.basicConfig(level=logging.INFO, format="%(name)s %(levelname)s: %(message)s", stream=sys.stdout)
_logger = logging.getLogger(__name__)

# Estimated cost per extracted block with Haiku 4.5 (~500 input + 250 output tokens)
_COST_PER_BLOCK_USD = 0.0018


# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------


def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="python -m backend.scripts.ingest_cpmd",
        description=(
            "Ingest a CPMD PDF for a printer model, writing error solutions directly to the DB.\n\n"
            "Requires DB_URL and ANTHROPIC_API_KEY env vars (not needed for --dry-run)."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--model-id",
        required=True,
        metavar="UUID",
        help="UUID of the printer model in the printer_models table",
    )
    parser.add_argument(
        "--pdf",
        required=True,
        metavar="PATH",
        help="Path to the local CPMD PDF file",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help=(
            "Parse only: show block count and estimated cost without "
            "calling Haiku or writing to the DB"
        ),
    )
    return parser.parse_args(argv)


# ---------------------------------------------------------------------------
# Dry-run
# ---------------------------------------------------------------------------


def _run_dry_run(pdf_bytes: bytes) -> None:
    from backend.application.services.cpmd_parser import extract_error_blocks

    blocks = extract_error_blocks(pdf_bytes)
    total = len(blocks)
    service_count = sum(1 for b in blocks if b.source_audience == "service")
    customers_count = sum(1 for b in blocks if b.source_audience == "customers")
    estimated_cost = total * _COST_PER_BLOCK_USD

    print(f"\nBloques detectados: {total}")
    print(f"Con sección 'service':   {service_count}")
    print(f"Con sección 'customers': {customers_count}")
    print(f"Costo estimado total:    ${estimated_cost:.4f} USD")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


def main(argv: list[str] | None = None) -> None:
    args = _parse_args(argv)

    # --- Validate PDF ---
    pdf_path = Path(args.pdf)
    if not pdf_path.exists():
        print(f"Error: PDF no encontrado: {pdf_path}", file=sys.stderr)
        sys.exit(1)

    try:
        pdf_bytes = pdf_path.read_bytes()
    except OSError as exc:
        print(f"Error: no se pudo leer el PDF: {exc}", file=sys.stderr)
        sys.exit(1)

    # --- Validate model_id format ---
    try:
        model_uuid = UUID(args.model_id)
    except ValueError:
        print(f"Error: model-id inválido: {args.model_id!r}", file=sys.stderr)
        sys.exit(1)

    # --- Dry-run: parse and count blocks, no DB/API calls ---
    if args.dry_run:
        _run_dry_run(pdf_bytes)
        return

    # --- Check required env vars before any DB/API work ---
    db_url = os.getenv("DB_URL")
    if not db_url:
        print(
            "Error: la variable de entorno DB_URL es requerida.\n"
            '  export DB_URL="<connection string de Neon producción>"',
            file=sys.stderr,
        )
        sys.exit(1)

    anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
    if not anthropic_api_key:
        print(
            "Error: la variable de entorno ANTHROPIC_API_KEY es requerida.\n"
            '  export ANTHROPIC_API_KEY="<tu key>"',
            file=sys.stderr,
        )
        sys.exit(1)

    # --- Lazy imports so env checks happen before any DB initialization ---
    from backend.infrastructure.database import Database, DatabaseUnavailableError
    from backend.infrastructure.repositories.printer_model_repository import PrinterModelRepository
    from backend.infrastructure.repositories.error_solution_repository import ErrorSolutionRepository
    from backend.application.services.cpmd_ingest import ingest_cpmd

    db = Database(dsn=db_url)
    model_repo = PrinterModelRepository(db)
    solution_repo = ErrorSolutionRepository(db)

    # --- Verify model exists ---
    try:
        model = model_repo.get_by_id(model_uuid)
    except DatabaseUnavailableError as exc:
        print(f"Error: no se pudo conectar a la DB: {exc}", file=sys.stderr)
        sys.exit(1)

    if model is None:
        print(f"Error: modelo {args.model_id} no encontrado en la DB.", file=sys.stderr)
        sys.exit(1)

    print(f"Modelo: {model.model_name} ({model.model_code})")
    print("Iniciando ingesta del CPMD…\n")

    # --- Run ingestion ---
    start = time.monotonic()
    report = ingest_cpmd(model_uuid, pdf_bytes, anthropic_api_key, repository=solution_repo)
    duration = time.monotonic() - start

    if report.skipped:
        print("\n⚠ CPMD ya procesado (mismo hash) — se omitió la ingesta.")
        print(f"  Hash: {report.cpmd_hash}")
        return

    estimated_cost = report.total_blocks * _COST_PER_BLOCK_USD

    print(f"\n✓ CPMD procesado para modelo {model_uuid}\n")
    print(f"  Hash:        {report.cpmd_hash}")
    print(f"  Bloques:     {report.total_blocks}")
    print(f"  Extraídos:   {report.extracted}")
    print(f"  Fallidos:    {report.failed}")
    print(f"  Tiempo:      {duration:.1f}s")
    print(f"  Costo aprox (tokens consumidos): ${estimated_cost:.4f} USD")


if __name__ == "__main__":
    main()
