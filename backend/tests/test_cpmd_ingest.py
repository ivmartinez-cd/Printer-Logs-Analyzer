"""Unit tests for cpmd_ingest.ingest_cpmd — hybrid regex + LLM pipeline."""

from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch
from uuid import UUID

from backend.application.services.cpmd_extractor import ExtractedSolution
from backend.application.services.cpmd_ingest import IngestReport, ingest_cpmd
from backend.application.services.cpmd_parser import ErrorBlock
from backend.application.services.cpmd_structured_extractor import ExtractionResult
from backend.domain.entities import ErrorSolution, ErrorSolutionFru

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_MODEL_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
_API_KEY = "sk-ant-test"
_FAKE_PDF = b"%PDF-1.4 fake content"
_FAKE_HASH = hashlib.sha256(_FAKE_PDF).hexdigest()
_NOW = datetime(2024, 3, 14, 10, 0, 0, tzinfo=timezone.utc)


def _make_solution(model_id: UUID = _MODEL_ID, cpmd_hash: str = _FAKE_HASH) -> ErrorSolution:
    return ErrorSolution(
        id=1,
        model_id=model_id,
        code="13.B2.00",
        title="Paper jam",
        cause="Worn roller.",
        technician_steps=["Replace roller."],
        frus=[ErrorSolutionFru(part_number="CE538-67905", description="Roller kit")],
        source_audience="service",
        source_page=5,
        cpmd_hash=cpmd_hash,
        created_at=_NOW,
    )


def _make_error_block(code: str = "13.B2.00") -> ErrorBlock:
    return ErrorBlock(
        code=code,
        raw_title="Paper jam in Tray 1",
        raw_text=(
            f"\n{code}   Paper jam\n"
            "The roller is worn and cannot pick paper.\n\n"
            "Recommended action for service\n"
            "1. Replace the pickup roller.\n"
            "2. Run a test print.\n"
        ),
        source_audience="service",
        source_page=5,
    )


def _make_extracted_solution(code: str = "13.B2.00") -> ExtractedSolution:
    return ExtractedSolution(
        code=code,
        title="Atasco de papel",
        cause="Rodillo desgastado.",
        technician_steps=["Reemplazar el rodillo."],
        frus=[{"part_number": "CE538-67905", "description": "Kit de rodillo"}],
    )


def _make_extraction_result(
    block: ErrorBlock,
    score: float = 0.85,
    solution: ExtractedSolution | None = None,
) -> ExtractionResult:
    if solution is None:
        solution = _make_extracted_solution(code=block.code)
    return ExtractionResult(
        block=block,
        solution=solution,
        confidence_score=score,
        has_fru_marker=False,
    )


# ---------------------------------------------------------------------------
# Idempotence tests
# ---------------------------------------------------------------------------


def test_second_call_with_same_hash_returns_skipped() -> None:
    """Calling ingest_cpmd twice with the same PDF must return skipped=True on the 2nd call."""
    mock_repo = MagicMock()
    block = _make_error_block()
    high_result = _make_extraction_result(block, score=0.9)

    # First call: no existing solutions
    mock_repo.list_by_model.return_value = []

    with (
        patch(
            "backend.application.services.cpmd_ingest.extract_error_blocks",
            return_value=[block],
        ),
        patch(
            "backend.application.services.cpmd_ingest.extract_all",
            return_value=[high_result],
        ),
        patch(
            "backend.application.services.cpmd_ingest.partition_by_confidence",
            return_value=([high_result], []),
        ),
    ):
        report1 = ingest_cpmd([_MODEL_ID], _FAKE_PDF, _API_KEY, repository=mock_repo)

    assert not report1.skipped
    assert report1.extracted == 1

    # Second call: repository now returns a solution with the same hash
    mock_repo.list_by_model.return_value = [_make_solution(cpmd_hash=_FAKE_HASH)]

    with (
        patch(
            "backend.application.services.cpmd_ingest.extract_error_blocks",
            return_value=[block],
        ) as mock_extract_blocks,
        patch(
            "backend.application.services.cpmd_ingest.extract_all",
            return_value=[high_result],
        ) as mock_extract_all,
    ):
        report2 = ingest_cpmd([_MODEL_ID], _FAKE_PDF, _API_KEY, repository=mock_repo)

    assert report2.skipped is True
    assert report2.reason == "Todos los modelos ya procesados"
    assert report2.cpmd_hash == _FAKE_HASH
    # PDF must not be re-processed
    mock_extract_blocks.assert_not_called()
    mock_extract_all.assert_not_called()


def test_different_hash_is_not_skipped() -> None:
    """A different PDF (different hash) must be processed even if solutions exist."""
    other_pdf = b"%PDF-1.4 different content"
    other_hash = hashlib.sha256(other_pdf).hexdigest()

    mock_repo = MagicMock()
    mock_repo.list_by_model.return_value = [_make_solution(cpmd_hash=_FAKE_HASH)]

    block = _make_error_block()
    high_result = _make_extraction_result(block, score=0.9)

    with (
        patch(
            "backend.application.services.cpmd_ingest.extract_error_blocks",
            return_value=[block],
        ),
        patch(
            "backend.application.services.cpmd_ingest.extract_all",
            return_value=[high_result],
        ),
        patch(
            "backend.application.services.cpmd_ingest.partition_by_confidence",
            return_value=([high_result], []),
        ),
    ):
        report = ingest_cpmd([_MODEL_ID], other_pdf, _API_KEY, repository=mock_repo)

    assert not report.skipped
    assert report.cpmd_hash == other_hash


# ---------------------------------------------------------------------------
# Happy path — all high confidence (regex only)
# ---------------------------------------------------------------------------


def test_all_high_confidence_no_llm_calls() -> None:
    """When all blocks are high confidence, extract_batch must never be called."""
    mock_repo = MagicMock()
    mock_repo.list_by_model.return_value = []

    blocks = [_make_error_block(code=f"13.B{i}.00") for i in range(3)]
    results = [_make_extraction_result(b, score=0.9) for b in blocks]

    with (
        patch(
            "backend.application.services.cpmd_ingest.extract_error_blocks",
            return_value=blocks,
        ),
        patch(
            "backend.application.services.cpmd_ingest.extract_all",
            return_value=results,
        ),
        patch(
            "backend.application.services.cpmd_ingest.partition_by_confidence",
            return_value=(results, []),  # all high
        ),
        patch(
            "backend.application.services.cpmd_ingest.extract_batch",
        ) as mock_batch,
    ):
        report = ingest_cpmd([_MODEL_ID], _FAKE_PDF, _API_KEY, repository=mock_repo)

    mock_batch.assert_not_called()
    assert report.regex_ok == 3
    assert report.llm_ok == 0
    assert report.failed == 0
    assert report.total_blocks == 3


# ---------------------------------------------------------------------------
# Happy path — low confidence fallback
# ---------------------------------------------------------------------------


def test_low_confidence_blocks_sent_to_llm() -> None:
    """Low-confidence blocks must be forwarded to extract_batch."""
    mock_repo = MagicMock()
    mock_repo.list_by_model.return_value = []

    high_block = _make_error_block(code="13.B0.00")
    low_block = _make_error_block(code="13.B1.00")

    high_result = _make_extraction_result(high_block, score=0.9)
    low_result = _make_extraction_result(low_block, score=0.3)

    llm_solution = _make_extracted_solution(code="13.B1.00")

    with (
        patch(
            "backend.application.services.cpmd_ingest.extract_error_blocks",
            return_value=[high_block, low_block],
        ),
        patch(
            "backend.application.services.cpmd_ingest.extract_all",
            return_value=[high_result, low_result],
        ),
        patch(
            "backend.application.services.cpmd_ingest.partition_by_confidence",
            return_value=([high_result], [low_result]),
        ),
        patch(
            "backend.application.services.cpmd_ingest.extract_batch",
            return_value=[llm_solution],
        ) as mock_batch,
    ):
        report = ingest_cpmd([_MODEL_ID], _FAKE_PDF, _API_KEY, repository=mock_repo)

    mock_batch.assert_called_once()
    assert report.regex_ok == 1
    assert report.llm_ok == 1
    assert report.failed == 0
    assert report.extracted == 2
    assert report.total_blocks == 2


def test_no_api_key_skips_llm_fallback() -> None:
    """Without api_key, low-confidence blocks must be discarded (no LLM call)."""
    mock_repo = MagicMock()
    mock_repo.list_by_model.return_value = []

    low_block = _make_error_block()
    low_result = _make_extraction_result(low_block, score=0.2)

    with (
        patch(
            "backend.application.services.cpmd_ingest.extract_error_blocks",
            return_value=[low_block],
        ),
        patch(
            "backend.application.services.cpmd_ingest.extract_all",
            return_value=[low_result],
        ),
        patch(
            "backend.application.services.cpmd_ingest.partition_by_confidence",
            return_value=([], [low_result]),  # all low
        ),
        patch(
            "backend.application.services.cpmd_ingest.extract_batch",
        ) as mock_batch,
    ):
        # No api_key supplied
        report = ingest_cpmd([_MODEL_ID], _FAKE_PDF, api_key=None, repository=mock_repo)

    mock_batch.assert_not_called()
    assert report.regex_ok == 0
    assert report.llm_ok == 0
    assert report.failed == 1


# ---------------------------------------------------------------------------
# Counts
# ---------------------------------------------------------------------------


def test_extracted_property_equals_regex_plus_llm() -> None:
    """IngestReport.extracted must equal regex_ok + llm_ok."""
    r = IngestReport(
        model_ids=[_MODEL_ID],
        cpmd_hash=_FAKE_HASH,
        total_blocks=10,
        regex_ok=7,
        llm_ok=2,
        failed=1,
    )
    assert r.extracted == 9
    assert r.extracted + r.failed == r.total_blocks


def test_report_contains_correct_model_id_and_hash() -> None:
    """IngestReport must echo back model_id and cpmd_hash."""
    mock_repo = MagicMock()
    mock_repo.list_by_model.return_value = []

    with (
        patch(
            "backend.application.services.cpmd_ingest.extract_error_blocks",
            return_value=[],
        ),
    ):
        report = ingest_cpmd([_MODEL_ID], _FAKE_PDF, _API_KEY, repository=mock_repo)

    assert report.model_ids == [_MODEL_ID]
    assert report.cpmd_hash == _FAKE_HASH
