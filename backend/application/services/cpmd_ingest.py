"""Orchestrator for CPMD ingestion: PDF → error blocks → hybrid extraction → DB persistence.

Pipeline:
  1. Parse PDF into ErrorBlocks (cpmd_parser).
  2. Run deterministic regex extraction on every block (cpmd_structured_extractor).
     Each block gets a confidence_score.
  3. Blocks with score >= threshold are persisted directly — zero API cost.
  4. Low-confidence blocks are sent to Claude Haiku in a single batch call
     (cpmd_extractor.extract_batch) and then merged back.
  5. All accepted solutions are written to the DB in one transaction
     (ErrorSolutionRepository.upsert_batch).

Public API:
  - ingest_cpmd(model_ids, pdf_bytes, api_key?, repository?, confidence_threshold?) → IngestReport
"""

from __future__ import annotations

import hashlib
import logging
from dataclasses import dataclass
from typing import List, Optional
from uuid import UUID

from backend.application.services.cpmd_extractor import ExtractedSolution, extract_batch
from backend.application.services.cpmd_parser import ErrorBlock, extract_error_blocks
from backend.application.services.cpmd_structured_extractor import (
    ExtractionResult,
    extract_all,
    partition_by_confidence,
)
from backend.domain.entities import ErrorSolution, ErrorSolutionFru
from backend.infrastructure.repositories.error_solution_repository import ErrorSolutionRepository

_logger = logging.getLogger(__name__)

DEFAULT_CONFIDENCE_THRESHOLD = 0.75


# ---------------------------------------------------------------------------
# Data class
# ---------------------------------------------------------------------------


@dataclass
class IngestReport:
    """Summary of a CPMD ingestion run."""

    model_ids: List[UUID]
    cpmd_hash: str
    total_blocks: int = 0
    regex_ok: int = 0       # blocks resolved by regex (no API call)
    llm_ok: int = 0         # blocks resolved by LLM fallback
    failed: int = 0         # blocks that neither extractor could handle
    solutions: List[ErrorSolution] = None  # extracted entities
    skipped: bool = False
    reason: str = ""

    @property
    def extracted(self) -> int:
        """Total successfully extracted (regex + LLM). Back-compat alias."""
        return self.regex_ok + self.llm_ok


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def ingest_cpmd(
    model_ids: List[UUID],
    pdf_bytes: bytes,
    api_key: Optional[str] = None,
    repository: Optional[ErrorSolutionRepository] = None,
    confidence_threshold: float = DEFAULT_CONFIDENCE_THRESHOLD,
) -> IngestReport:
    """Ingest a CPMD PDF for one or more printer models.

    Idempotent: for each model in *model_ids*, if solutions with the same
    PDF hash already exist in the repository, ingestion is skipped for
    that specific model. If all models are skipped, the function returns
    immediately with ``skipped=True``.

    ``api_key`` is optional. When provided, blocks whose regex confidence
    score is below *confidence_threshold* are escalated to Claude Haiku
    via a single batch call. When omitted, only the regex extractor is used
    and low-confidence blocks are discarded (logged as warnings).
    """
    repo = repository or ErrorSolutionRepository()
    cpmd_hash = _sha256(pdf_bytes)

    # --- Idempotence check per model ---
    to_ingest: List[UUID] = []
    for m_id in model_ids:
        existing = repo.list_by_model(m_id)
        if existing and any(s.cpmd_hash == cpmd_hash for s in existing):
            _logger.info(
                "[cpmd_ingest] model_id=%s hash=%s...: ya procesado, saltando",
                m_id,
                cpmd_hash[:12],
            )
            continue
        to_ingest.append(m_id)

    if not to_ingest:
        return IngestReport(
            model_ids=model_ids,
            cpmd_hash=cpmd_hash,
            skipped=True,
            reason="Todos los modelos ya procesados",
        )

    # --- Extract blocks from PDF ---
    _logger.info(
        "[cpmd_ingest] Extrayendo bloques del PDF (targets=%d, hash=%s...)",
        len(to_ingest),
        cpmd_hash[:12],
    )
    blocks = extract_error_blocks(pdf_bytes)
    total = len(blocks)
    _logger.info("[cpmd_ingest] %d bloques encontrados", total)

    # --- Step 1: deterministic regex extraction ---
    results = extract_all(blocks)
    high_conf, low_conf = partition_by_confidence(results, threshold=confidence_threshold)

    _logger.info(
        "[cpmd_ingest] Regex pass: %d alta confianza, %d baja confianza (threshold=%.2f)",
        len(high_conf),
        len(low_conf),
        confidence_threshold,
    )

    # --- Step 2: LLM batch fallback for low-confidence blocks ---
    llm_solutions: List[ExtractedSolution] = []
    if low_conf:
        if api_key:
            low_blocks = [r.block for r in low_conf]
            _logger.info(
                "[cpmd_ingest] Enviando %d bloques de baja confianza al LLM (batch)…",
                len(low_blocks),
            )
            llm_solutions = extract_batch(low_blocks, api_key)
            _logger.info(
                "[cpmd_ingest] LLM batch: %d/%d bloques resueltos",
                len(llm_solutions),
                len(low_blocks),
            )
        else:
            _logger.warning(
                "[cpmd_ingest] %d bloques de baja confianza no se enviarán al LLM "
                "(api_key no proporcionada). Serán descartados.",
                len(low_conf),
            )

    # --- Step 3: build final solution list ---
    pairs: List[tuple[ErrorBlock, ExtractedSolution]] = []

    for result in high_conf:
        if result.solution is not None:
            pairs.append((result.block, result.solution))

    # Pair LLM solutions back to their blocks (same order as low_conf)
    for i, sol in enumerate(llm_solutions):
        if i < len(low_conf):
            pairs.append((low_conf[i].block, sol))

    # --- Step 4: persist for each model ---
    all_solutions: List[ErrorSolution] = []
    for m_id in to_ingest:
        m_solutions = _persist_batch(repo, m_id, pairs, cpmd_hash)
        all_solutions.extend(m_solutions)

    regex_ok = len(high_conf)
    llm_ok = len(llm_solutions)
    failed = total - regex_ok - llm_ok

    _logger.info(
        "[cpmd_ingest] Finalizada ingesta para %d modelos: regex=%d llm=%d fallidos=%d / total=%d",
        len(to_ingest),
        regex_ok,
        llm_ok,
        failed,
        total,
    )

    return IngestReport(
        model_ids=model_ids,
        cpmd_hash=cpmd_hash,
        total_blocks=total,
        regex_ok=regex_ok,
        llm_ok=llm_ok,
        failed=failed,
        solutions=all_solutions,
    )


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------


def _sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _persist_batch(
    repo: ErrorSolutionRepository,
    model_id: UUID,
    pairs: List[tuple[ErrorBlock, ExtractedSolution]],
    cpmd_hash: str,
) -> List[ErrorSolution]:
    """Build ErrorSolution entities and upsert them all in one transaction."""
    entities: List[ErrorSolution] = []
    for block, solution in pairs:
        frus = [
            ErrorSolutionFru(part_number=f["part_number"], description=f["description"])
            for f in solution.frus
        ]
        entities.append(
            ErrorSolution(
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
        )

    if not entities:
        _logger.warning("[cpmd_ingest] No hay soluciones para persistir.")
        return []

    # Use upsert_batch if available, fall back to individual upserts
    if hasattr(repo, "upsert_batch"):
        repo.upsert_batch(entities)
    else:
        for entity in entities:
            repo.upsert(entity)
    
    return entities
