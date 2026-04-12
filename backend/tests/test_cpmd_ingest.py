"""Unit tests for cpmd_ingest.ingest_cpmd."""

from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch
from uuid import UUID

import pytest

from backend.application.services.cpmd_ingest import IngestReport, ingest_cpmd
from backend.application.services.cpmd_extractor import ExtractedSolution
from backend.application.services.cpmd_parser import ErrorBlock
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


def _make_error_block() -> ErrorBlock:
    return ErrorBlock(
        code="13.B2.00",
        raw_title="Paper jam in Tray 1",
        raw_text="13.B2.00 Paper jam\nRecommended action for service\n1. Replace roller.",
        source_audience="service",
        source_page=5,
    )


def _make_extracted_solution() -> ExtractedSolution:
    return ExtractedSolution(
        code="13.B2.00",
        title="Atasco de papel",
        cause="Rodillo desgastado.",
        technician_steps=["Reemplazar el rodillo."],
        frus=[{"part_number": "CE538-67905", "description": "Kit de rodillo"}],
    )


# ---------------------------------------------------------------------------
# Idempotence tests
# ---------------------------------------------------------------------------


def test_second_call_with_same_hash_returns_skipped() -> None:
    """Calling ingest_cpmd twice with the same PDF must return skipped=True on the 2nd call."""
    mock_repo = MagicMock()
    # First call: no existing solutions
    mock_repo.list_by_model.return_value = []
    mock_repo.upsert.return_value = _make_solution()

    with (
        patch(
            "backend.application.services.cpmd_ingest.extract_error_blocks",
            return_value=[_make_error_block()],
        ),
        patch(
            "backend.application.services.cpmd_ingest.extract_solution",
            return_value=_make_extracted_solution(),
        ),
    ):
        report1 = ingest_cpmd(_MODEL_ID, _FAKE_PDF, _API_KEY, repository=mock_repo)

    assert not report1.skipped
    assert report1.extracted == 1

    # Second call: repository now returns a solution with the same hash
    mock_repo.list_by_model.return_value = [_make_solution(cpmd_hash=_FAKE_HASH)]

    with (
        patch(
            "backend.application.services.cpmd_ingest.extract_error_blocks",
            return_value=[_make_error_block()],
        ) as mock_extract_blocks,
        patch(
            "backend.application.services.cpmd_ingest.extract_solution",
            return_value=_make_extracted_solution(),
        ) as mock_extract_sol,
    ):
        report2 = ingest_cpmd(_MODEL_ID, _FAKE_PDF, _API_KEY, repository=mock_repo)

    assert report2.skipped is True
    assert report2.reason == "Ya procesado"
    assert report2.cpmd_hash == _FAKE_HASH
    # PDF should not be re-processed
    mock_extract_blocks.assert_not_called()
    mock_extract_sol.assert_not_called()


def test_different_hash_is_not_skipped() -> None:
    """A different PDF (different hash) must be processed even if solutions exist."""
    other_pdf = b"%PDF-1.4 different content"
    other_hash = hashlib.sha256(other_pdf).hexdigest()

    mock_repo = MagicMock()
    # Existing solutions have the *old* hash
    mock_repo.list_by_model.return_value = [_make_solution(cpmd_hash=_FAKE_HASH)]
    mock_repo.upsert.return_value = _make_solution(cpmd_hash=other_hash)

    with (
        patch(
            "backend.application.services.cpmd_ingest.extract_error_blocks",
            return_value=[_make_error_block()],
        ),
        patch(
            "backend.application.services.cpmd_ingest.extract_solution",
            return_value=_make_extracted_solution(),
        ),
    ):
        report = ingest_cpmd(_MODEL_ID, other_pdf, _API_KEY, repository=mock_repo)

    assert not report.skipped
    assert report.cpmd_hash == other_hash


# ---------------------------------------------------------------------------
# Happy path
# ---------------------------------------------------------------------------


def test_happy_path_counts_are_correct() -> None:
    """extracted + failed must equal total_blocks."""
    mock_repo = MagicMock()
    mock_repo.list_by_model.return_value = []
    mock_repo.upsert.return_value = _make_solution()

    blocks = [_make_error_block(), _make_error_block(), _make_error_block()]
    # Second block fails extraction
    solutions = [_make_extracted_solution(), None, _make_extracted_solution()]

    with (
        patch(
            "backend.application.services.cpmd_ingest.extract_error_blocks",
            return_value=blocks,
        ),
        patch(
            "backend.application.services.cpmd_ingest.extract_solution",
            side_effect=solutions,
        ),
    ):
        report = ingest_cpmd(_MODEL_ID, _FAKE_PDF, _API_KEY, repository=mock_repo)

    assert report.total_blocks == 3
    assert report.extracted == 2
    assert report.failed == 1
    assert report.extracted + report.failed == report.total_blocks


def test_report_contains_correct_model_id_and_hash() -> None:
    """IngestReport must echo back model_id and cpmd_hash."""
    mock_repo = MagicMock()
    mock_repo.list_by_model.return_value = []
    mock_repo.upsert.return_value = _make_solution()

    with (
        patch(
            "backend.application.services.cpmd_ingest.extract_error_blocks",
            return_value=[],
        ),
    ):
        report = ingest_cpmd(_MODEL_ID, _FAKE_PDF, _API_KEY, repository=mock_repo)

    assert report.model_id == _MODEL_ID
    assert report.cpmd_hash == _FAKE_HASH
