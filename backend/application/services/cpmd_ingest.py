"""Orchestrator for CPMD ingestion: PDF → error blocks → Haiku extraction → DB persistence.

Public API:
  - ingest_cpmd(model_id, pdf_bytes, api_key, repository?) → IngestReport
"""

from __future__ import annotations

import hashlib
import logging
from dataclasses import dataclass, field
from typing import Optional
from uuid import UUID

from backend.application.services.cpmd_extractor import ExtractedSolution, extract_solution
from backend.application.services.cpmd_parser import ErrorBlock, extract_error_blocks
from backend.domain.entities import ErrorSolution, ErrorSolutionFru
from backend.infrastructure.repositories.error_solution_repository import ErrorSolutionRepository

_logger = logging.getLogger(__name__)

_LOG_PROGRESS_EVERY = 25  # log a progress line every N blocks


# ---------------------------------------------------------------------------
# Data class
# ---------------------------------------------------------------------------


@dataclass
class IngestReport:
    """Summary of a CPMD ingestion run."""

    model_id: UUID
    cpmd_hash: str
    total_blocks: int = 0
    extracted: int = 0
    failed: int = 0
    skipped: bool = False
    reason: str = ""


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def ingest_cpmd(
    model_id: UUID,
    pdf_bytes: bytes,
    api_key: str,
    repository: Optional[ErrorSolutionRepository] = None,
) -> IngestReport:
    """Ingest a CPMD PDF for a given printer model.

    Idempotent: if solutions for *model_id* with the same PDF hash already
    exist in the repository, the function returns immediately with
    ``skipped=True``.

    Calls are sequential — no batch async.
    """
    repo = repository or ErrorSolutionRepository()
    cpmd_hash = _sha256(pdf_bytes)

    # --- Idempotence check ---
    existing = repo.list_by_model(model_id)
    if existing and any(s.cpmd_hash == cpmd_hash for s in existing):
        _logger.info(
            "[cpmd_ingest] model_id=%s hash=%s…: ya procesado, saltando",
            model_id,
            cpmd_hash[:12],
        )
        return IngestReport(
            model_id=model_id,
            cpmd_hash=cpmd_hash,
            skipped=True,
            reason="Ya procesado",
        )

    # --- Extract blocks from PDF ---
    _logger.info(
        "[cpmd_ingest] Extrayendo bloques del PDF (model_id=%s, hash=%s…)",
        model_id,
        cpmd_hash[:12],
    )
    blocks = extract_error_blocks(pdf_bytes)
    total = len(blocks)
    _logger.info("[cpmd_ingest] model_id=%s: %d bloques encontrados", model_id, total)

    extracted_count = 0
    failed_count = 0

    for idx, block in enumerate(blocks, start=1):
        solution = extract_solution(block, api_key)

        if solution is None:
            failed_count += 1
        else:
            _persist(repo, model_id, block, solution, cpmd_hash)
            extracted_count += 1

        if idx % _LOG_PROGRESS_EVERY == 0:
            _logger.info(
                "[cpmd_ingest] CPMD ingest: %d/%d procesados, %d ok, %d fallidos",
                idx,
                total,
                extracted_count,
                failed_count,
            )

    _logger.info(
        "[cpmd_ingest] Finalizado model_id=%s: %d/%d ok, %d fallidos",
        model_id,
        extracted_count,
        total,
        failed_count,
    )

    return IngestReport(
        model_id=model_id,
        cpmd_hash=cpmd_hash,
        total_blocks=total,
        extracted=extracted_count,
        failed=failed_count,
    )


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------


def _sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _persist(
    repo: ErrorSolutionRepository,
    model_id: UUID,
    block: ErrorBlock,
    solution: ExtractedSolution,
    cpmd_hash: str,
) -> None:
    frus = [
        ErrorSolutionFru(part_number=f["part_number"], description=f["description"])
        for f in solution.frus
    ]
    entity = ErrorSolution(
        model_id=model_id,
        code=solution.code,
        title=solution.title,
        cause=solution.cause,
        technician_steps=solution.technician_steps,
        frus=frus,
        source_audience=block.source_audience,
        source_page=block.source_page,
        cpmd_hash=cpmd_hash,
    )
    repo.upsert(entity)
