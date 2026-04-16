"""CLI script to ingest a CPMD PDF for a printer model, writing directly to the DB.

Bypass para el endpoint POST /models/{id}/cpmd que da 502 en Render free por
timeout (5-10 min por CPMD). Este script corre en la máquina local y escribe
directamente en la DB de producción (Neon) usando los mismos servicios.

Pipeline de extracción (híbrido):
  1. Regex determinista → resuelve ~85-95% de los bloques sin API
  2. Claude Haiku (batch) → resuelve los bloques de baja confianza en 1-3 llamadas

Usage:
  python -m backend.scripts.ingest_cpmd --model-id <uuid> --pdf <path>
  python -m backend.scripts.ingest_cpmd --family <name> --pdf <path>
  python -m backend.scripts.ingest_cpmd --family <name> --pdf <path> --dry-run
"""

from __future__ import annotations

import argparse
import logging
import os
import sys
import time
from pathlib import Path
from uuid import UUID

from dotenv import load_dotenv

# Log to stdout so progress lines appear in the terminal
logging.basicConfig(
    level=logging.INFO, format="%(name)s %(levelname)s: %(message)s", stream=sys.stdout
)
_logger = logging.getLogger(__name__)

# Pricing reference (Haiku 4.5) — only applies to blocks that go through LLM fallback
_PRICE_INPUT_PER_M = 0.80  # USD per 1M input tokens
_PRICE_OUTPUT_PER_M = 4.00  # USD per 1M output tokens
_AVG_TOKENS_PER_BLOCK = 600  # rough estimate: ~450 input + 150 output per block


# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------


def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="python -m backend.scripts.ingest_cpmd",
        description=(
            "Ingest a CPMD PDF for a printer model, writing error solutions directly to the DB.\n\n"
            "Uses a hybrid extractor: regex first, LLM fallback only for uncertain blocks.\n"
            "Requires DB_URL env var. ANTHROPIC_API_KEY is needed only for LLM fallback."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--model-id",
        metavar="UUID",
        help="UUID of a specific printer model",
    )
    parser.add_argument(
        "--family",
        metavar="NAME",
        help="Printer family name (e.g. E626xx) to ingest for all its models",
    )
    parser.add_argument(
        "--pdf",
        required=True,
        metavar="PATH",
        help="Path to the local CPMD PDF file",
    )
    parser.add_argument(
        "--output-sql",
        metavar="PATH",
        help="Generate a .sql file with INSERT statements instead of writing to the DB",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help=(
            "Parse only: show block count, confidence distribution, and estimated cost "
            "without calling the LLM or writing to the DB"
        ),
    )
    parser.add_argument(
        "--no-llm-fallback",
        action="store_true",
        help="Disable LLM fallback — regex-only mode, even for low-confidence blocks",
    )
    parser.add_argument(
        "--confidence-threshold",
        type=float,
        default=0.75,
        metavar="FLOAT",
        help="Minimum regex confidence score to accept a block without LLM (default: 0.75)",
    )
    return parser.parse_args(argv)


# ---------------------------------------------------------------------------
# Dry-run
# ---------------------------------------------------------------------------


def _run_dry_run(pdf_bytes: bytes, threshold: float, target_models: list) -> None:
    from backend.application.services.cpmd_parser import extract_error_blocks
    from backend.application.services.cpmd_structured_extractor import (
        extract_all,
        partition_by_confidence,
    )

    blocks = extract_error_blocks(pdf_bytes)
    results = extract_all(blocks)
    high, low = partition_by_confidence(results, threshold=threshold)

    total = len(blocks)
    llm_blocks = len(low)

    print(f"\n{'=' * 55}")
    print(f"  CPMD DRY-RUN  (threshold={threshold:.2f})")
    print(f"{'=' * 55}")
    print(f"  Modelos objetivo:            {len(target_models)}")
    for m in target_models:
        print(f"    - {m.model_name} ({m.model_code})")
    print(f"{'-' * 55}")

    llm_calls_estimate = max(1, llm_blocks // 20) if llm_blocks else 0  # 20 blocks/call

    # Cost estimate for LLM fallback blocks only
    estimated_tokens = llm_blocks * _AVG_TOKENS_PER_BLOCK
    estimated_cost = (
        estimated_tokens * 0.75 * _PRICE_INPUT_PER_M / 1_000_000
        + estimated_tokens * 0.25 * _PRICE_OUTPUT_PER_M / 1_000_000
    )

    # Score distribution
    scores = [r.confidence_score for r in results]
    avg_score = sum(scores) / len(scores) if scores else 0.0

    print(f"\n{'=' * 55}")
    print(f"  CPMD DRY-RUN  (threshold={threshold:.2f})")
    print(f"{'=' * 55}")
    print(f"  Bloques totales:             {total}")
    if total > 0:
        print(f"  Alta confianza (regex ok):   {len(high)}  ({len(high) / total * 100:.0f}%)")
        print(f"  Baja confianza (-> LLM):      {llm_blocks}  ({llm_blocks / total * 100:.0f}%)")
    else:
        print("  Alta confianza (regex ok):   0  (0%)")
        print("  Baja confianza (-> LLM):      0  (0%)")
    print(f"  Score promedio:              {avg_score:.3f}")
    print(f"  Llamadas LLM estimadas:      {llm_calls_estimate}")
    print(f"  Costo estimado LLM fallback: ${estimated_cost:.4f} USD")
    print(f"{'=' * 55}\n")

    if llm_blocks:
        print("Bloques de baja confianza:")
        for r in results:
            if r.confidence_score < threshold:
                print(
                    f"  {r.block.code:20s}  score={r.confidence_score:.3f}  "
                    f"cause_len={len(r.solution.cause if r.solution else '')}  "
                    f"steps={len(r.solution.technician_steps if r.solution else [])}"
                )


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


def main(argv: list[str] | None = None) -> None:
    # Load .env from root (two levels up from scripts/ OR root if running from root)
    # The config.py does it too, but we need DB_URL before lazy imports.
    load_dotenv()

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

    # --- Validate targets ---
    if not args.model_id and not args.family:
        print("Error: se requiere --model-id o --family", file=sys.stderr)
        sys.exit(1)

    # --- Check required env vars ---
    db_url = os.getenv("DB_URL")
    if not db_url and not args.output_sql:
        # We only strictly require DB_URL if we are writing to the DB
        print(
            "Error: la variable de entorno DB_URL es requerida para escribir en la DB.\n"
            '  export DB_URL="<connection string de Neon producción>"\n'
            "  o usa --output-sql para generar un archivo sin conexión.",
            file=sys.stderr,
        )
        sys.exit(1)

    # --- Lazy imports ---
    from backend.application.services.cpmd_ingest import ingest_cpmd
    from backend.infrastructure.database import Database, DatabaseUnavailableError
    from backend.infrastructure.repositories.error_solution_repository import (
        ErrorSolutionRepository,
    )
    from backend.infrastructure.repositories.printer_model_repository import PrinterModelRepository

    db = Database(dsn=db_url) if db_url else None
    model_repo = PrinterModelRepository(db) if db else None
    # We don't really need the solution_repo if we are exporting SQL,
    # and _DummyRepo handles the skip logic.
    solution_repo = ErrorSolutionRepository(db) if db else None

    # --- Check required env vars ---
    anthropic_api_key = os.getenv("ANTHROPIC_API_KEY") if not args.no_llm_fallback else None
    if not args.no_llm_fallback and not anthropic_api_key:
        print(
            "Aviso: ANTHROPIC_API_KEY no está definida.\n"
            "  Los bloques de baja confianza serán descartados (modo regex-only).\n"
            "  Para habilitar el fallback LLM: export ANTHROPIC_API_KEY=sk-ant-...\n"
            "  Para suprimir este aviso: --no-llm-fallback"
        )

    target_models = []
    if args.model_id:
        try:
            m_uuid = UUID(args.model_id)
            if model_repo:
                try:
                    model = model_repo.get_by_id(m_uuid)
                    if model:
                        target_models.append(model)
                    else:
                        print(f"Error: modelo {args.model_id} no encontrado", file=sys.stderr)
                        sys.exit(1)
                except DatabaseUnavailableError:
                    _logger.warning(
                        "No se pudo conectar a la DB para verificar modelo. Usando ID directamente."
                    )
                    # Create a mock model if we can't verify but have the ID
                    mock_m = _MockModel(m_uuid, name="Unknown (ID provided)", code="UNK")
                    target_models.append(mock_m)
            else:
                # No repo but we have the ID, assume it's valid for SQL export
                mock_m = _MockModel(m_uuid, name="Unknown (offline)", code="UNK")
                target_models.append(mock_m)
        except ValueError:
            print(f"Error: model-id inválido: {args.model_id!r}", file=sys.stderr)
            sys.exit(1)

    if args.family:
        if not model_repo:
            print("Error: se requiere DB_URL para resolver familias.", file=sys.stderr)
            sys.exit(1)
        try:
            models = model_repo.list_by_family(args.family)
            if not models:
                print(
                    f"Error: no se encontraron modelos para la familia {args.family}",
                    file=sys.stderr,
                )
                sys.exit(1)
            # Avoid duplicates if both --model-id and --family are used
            existing_ids = {m.id for m in target_models}
            for m in models:
                if m.id not in existing_ids:
                    target_models.append(m)
        except DatabaseUnavailableError:
            print("Error: no se pudo conectar a la DB para resolver la familia.", file=sys.stderr)
            sys.exit(1)

    # --- Dry-run: parse and analyse blocks, no DB/API calls ---
    if args.dry_run:
        _run_dry_run(pdf_bytes, threshold=args.confidence_threshold, target_models=target_models)
        return

    print(f"Modelos objetivo: {len(target_models)}")
    for m in target_models:
        print(f"  - {m.model_name} ({m.model_code})")
    print(f"Threshold de confianza: {args.confidence_threshold:.2f}")
    print(f"LLM fallback: {'deshabilitado' if args.no_llm_fallback else 'habilitado (batch)'}")
    print("Iniciando ingesta del CPMD...\n")

    # --- Run ingestion ---
    start = time.monotonic()
    model_ids = [m.id for m in target_models]

    # If exporting SQL, we don't want to skip models just because they are in the DB.
    # We want ALL solutions translated to SQL for those models.
    # To bypass skip logic in ingest_cpmd, we can use a mock repo.
    if args.output_sql:
        mock_repo = _DummyRepo()
        actual_repo = mock_repo
    else:
        actual_repo = solution_repo

    report = ingest_cpmd(
        model_ids,
        pdf_bytes,
        api_key=anthropic_api_key,
        repository=actual_repo,
        confidence_threshold=args.confidence_threshold,
    )
    duration = time.monotonic() - start

    if args.output_sql and report.solutions:
        _export_to_sql(args.output_sql, report.solutions)
        print(f"\n[OK] SQL exportado a: {args.output_sql}")
        if not db_url:
            print("  Nota: exportado en modo OFFLINE (ID de modelo no verificado)")

    if report.skipped and not args.output_sql:
        print("\n[!] CPMD ya procesado (mismo hash) - se omitio la ingesta.")
        print(f"  Hash: {report.cpmd_hash}")
        return

    # Estimate LLM cost (rough)
    llm_tokens = report.llm_ok * _AVG_TOKENS_PER_BLOCK
    llm_cost = (
        llm_tokens * 0.75 * _PRICE_INPUT_PER_M / 1_000_000
        + llm_tokens * 0.25 * _PRICE_OUTPUT_PER_M / 1_000_000
    )

    print(f"\n[OK] CPMD procesado para {len(target_models)} modelos")
    if not args.output_sql:
        print("  Escrito directamente en la DB")
    else:
        print(f"  Generado archivo SQL: {args.output_sql}")

    print(f"  Hash:             {report.cpmd_hash}")
    print(f"  Bloques totales:  {report.total_blocks}")
    print(f"  Regex ok:         {report.regex_ok}  (sin costo API)")
    print(f"  LLM fallback ok:  {report.llm_ok}")
    print(f"  Fallidos:         {report.failed}")
    print(f"  Tiempo:           {duration:.1f}s")
    print(f"  Costo estimado:   ${llm_cost:.4f} USD (solo bloques LLM)")


# ---------------------------------------------------------------------------
# SQL Export Helper
# ---------------------------------------------------------------------------


class _DummyRepo:
    """Mock repo that always returns empty to bypass skip logic during SQL export."""

    def list_by_model(self, *args, **kwargs):
        return []

    def upsert(self, *args, **kwargs):
        """No-op for SQL export."""
        pass

    def upsert_batch(self, *args, **kwargs):
        """No-op for SQL export."""
        pass


class _MockModel:
    """Simple mock for PrinterModel when DB is unavailable."""

    def __init__(self, id_uuid: UUID, name: str, code: str):
        self.id = id_uuid
        self.model_name = name
        self.model_code = code


def _export_to_sql(output_path: str, solutions: list) -> None:
    """Generate PostgreSQL INSERT statements for ErrorSolution entities."""
    import json

    lines = [
        "-- Ingesta CPMD exportada a SQL",
        f"-- Fecha: {time.strftime('%Y-%m-%d %H:%M:%S')}",
        "BEGIN;",
        "",
    ]

    for s in solutions:
        # Escape strings for SQL (double single quotes)
        def esc(val):
            if val is None:
                return "NULL"
            return "'" + str(val).replace("'", "''") + "'"

        # JSON objects
        steps_json = json.dumps(s.technician_steps, ensure_ascii=False)
        frus_json = json.dumps([fru.model_dump() for fru in s.frus], ensure_ascii=False)

        sql = (
            "INSERT INTO error_solutions\n"
            "    (model_id, code, title, cause, technician_steps, frus, source_audience, source_page, cpmd_hash)\n"
            f"VALUES ({esc(s.model_id)}, {esc(s.code)}, {esc(s.title)}, {esc(s.cause)}, \n"
            f"        {esc(steps_json)}::jsonb, {esc(frus_json)}::jsonb, \n"
            f"        {esc(s.source_audience)}, {s.source_page or 'NULL'}, {esc(s.cpmd_hash)})\n"
            "ON CONFLICT (model_id, code) DO UPDATE SET\n"
            "    title             = EXCLUDED.title,\n"
            "    cause             = EXCLUDED.cause,\n"
            "    technician_steps  = EXCLUDED.technician_steps,\n"
            "    frus              = EXCLUDED.frus,\n"
            "    source_audience   = EXCLUDED.source_audience,\n"
            "    source_page       = EXCLUDED.source_page,\n"
            "    cpmd_hash         = EXCLUDED.cpmd_hash;"
        )
        lines.append(sql)
        lines.append("")

    lines.append("COMMIT;")

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


if __name__ == "__main__":
    main()
