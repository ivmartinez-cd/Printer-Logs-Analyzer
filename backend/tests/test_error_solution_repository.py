"""Tests for ErrorSolutionRepository — JSON fallback only (no DB required)."""

import json
import tempfile
from pathlib import Path
from unittest.mock import patch
from uuid import UUID

from backend.domain.entities import ErrorSolution, ErrorSolutionFru
from backend.infrastructure.repositories.error_solution_repository import (
    ErrorSolutionRepository,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

MODEL_ID = UUID("00000000-0000-0000-0000-000000000001")
MODEL_ID_2 = UUID("00000000-0000-0000-0000-000000000002")


_DEFAULT_STEPS = ["Check fuser", "Replace if needed"]
_DEFAULT_FRUS = [ErrorSolutionFru(part_number="RM1-1234", description="Fuser Assembly")]

_SENTINEL = object()


def _make_solution(
    model_id: UUID = MODEL_ID,
    code: str = "50.3F.FF",
    title: str = "Fuser error",
    cause: str = "Fuser assembly failed",
    technician_steps: list = _SENTINEL,  # type: ignore[assignment]
    frus: list = _SENTINEL,  # type: ignore[assignment]
    source_audience: str = "service",
    source_page: int = 42,
    cpmd_hash: str = "abc123",
) -> ErrorSolution:
    return ErrorSolution(
        model_id=model_id,
        code=code,
        title=title,
        cause=cause,
        technician_steps=_DEFAULT_STEPS if technician_steps is _SENTINEL else technician_steps,
        frus=_DEFAULT_FRUS if frus is _SENTINEL else frus,
        source_audience=source_audience,
        source_page=source_page,
        cpmd_hash=cpmd_hash,
    )


def _make_repo(tmp_path: Path) -> ErrorSolutionRepository:
    repo = ErrorSolutionRepository.__new__(ErrorSolutionRepository)
    return repo


# ---------------------------------------------------------------------------
# Test: upsert creates a new entry
# ---------------------------------------------------------------------------


def test_upsert_creates_new_entry():
    with tempfile.TemporaryDirectory() as tmpdir:
        local = Path(tmpdir) / "error_solutions.json"
        local.write_text("[]", encoding="utf-8")

        with patch(
            "backend.infrastructure.repositories.error_solution_repository._LOCAL_PATH",
            local,
        ):
            repo = _make_repo(local)
            solution = _make_solution()
            result = repo._upsert_local(solution)

        data = json.loads(local.read_text(encoding="utf-8"))
        assert len(data) == 1
        assert data[0]["code"] == "50.3F.FF"
        assert result.code == "50.3F.FF"
        assert result.model_id == MODEL_ID


# ---------------------------------------------------------------------------
# Test: upsert on existing (model_id, code) updates, does not duplicate
# ---------------------------------------------------------------------------


def test_upsert_updates_existing_does_not_duplicate():
    with tempfile.TemporaryDirectory() as tmpdir:
        local = Path(tmpdir) / "error_solutions.json"
        local.write_text("[]", encoding="utf-8")

        with patch(
            "backend.infrastructure.repositories.error_solution_repository._LOCAL_PATH",
            local,
        ):
            repo = _make_repo(local)
            repo._upsert_local(_make_solution(title="Original"))
            repo._upsert_local(_make_solution(title="Updated"))

        data = json.loads(local.read_text(encoding="utf-8"))
        assert len(data) == 1
        assert data[0]["title"] == "Updated"


# ---------------------------------------------------------------------------
# Test: get_by_model_and_code returns None when not found
# ---------------------------------------------------------------------------


def test_get_by_model_and_code_returns_none_when_missing():
    with tempfile.TemporaryDirectory() as tmpdir:
        local = Path(tmpdir) / "error_solutions.json"
        local.write_text("[]", encoding="utf-8")

        with patch(
            "backend.infrastructure.repositories.error_solution_repository._LOCAL_PATH",
            local,
        ):
            repo = _make_repo(local)
            result = repo._get_by_model_and_code_local(MODEL_ID, "99.ZZ.ZZ")

        assert result is None


# ---------------------------------------------------------------------------
# Test: get_by_model_and_code returns the correct entry
# ---------------------------------------------------------------------------


def test_get_by_model_and_code_returns_matching_entry():
    with tempfile.TemporaryDirectory() as tmpdir:
        local = Path(tmpdir) / "error_solutions.json"
        local.write_text("[]", encoding="utf-8")

        with patch(
            "backend.infrastructure.repositories.error_solution_repository._LOCAL_PATH",
            local,
        ):
            repo = _make_repo(local)
            repo._upsert_local(_make_solution(code="50.3F.FF"))
            repo._upsert_local(_make_solution(code="13.00.00"))
            result = repo._get_by_model_and_code_local(MODEL_ID, "50.3F.FF")

        assert result is not None
        assert result.code == "50.3F.FF"


# ---------------------------------------------------------------------------
# Test: delete_by_model deletes only entries for that model
# ---------------------------------------------------------------------------


def test_delete_by_model_removes_only_target_model():
    with tempfile.TemporaryDirectory() as tmpdir:
        local = Path(tmpdir) / "error_solutions.json"
        local.write_text("[]", encoding="utf-8")

        with patch(
            "backend.infrastructure.repositories.error_solution_repository._LOCAL_PATH",
            local,
        ):
            repo = _make_repo(local)
            repo._upsert_local(_make_solution(model_id=MODEL_ID, code="50.3F.FF"))
            repo._upsert_local(_make_solution(model_id=MODEL_ID, code="13.00.00"))
            repo._upsert_local(_make_solution(model_id=MODEL_ID_2, code="50.3F.FF"))

            count = repo._delete_by_model_local(MODEL_ID)

        data = json.loads(local.read_text(encoding="utf-8"))
        assert count == 2
        assert len(data) == 1
        assert data[0]["model_id"] == str(MODEL_ID_2)


# ---------------------------------------------------------------------------
# Test: list_by_model returns only entries for that model, ordered by code
# ---------------------------------------------------------------------------


def test_list_by_model_returns_only_target_model_sorted():
    with tempfile.TemporaryDirectory() as tmpdir:
        local = Path(tmpdir) / "error_solutions.json"
        local.write_text("[]", encoding="utf-8")

        with patch(
            "backend.infrastructure.repositories.error_solution_repository._LOCAL_PATH",
            local,
        ):
            repo = _make_repo(local)
            repo._upsert_local(_make_solution(model_id=MODEL_ID, code="Z9.00.00"))
            repo._upsert_local(_make_solution(model_id=MODEL_ID, code="13.00.00"))
            repo._upsert_local(_make_solution(model_id=MODEL_ID_2, code="50.3F.FF"))

            results = repo._list_by_model_local(MODEL_ID)

        assert len(results) == 2
        assert results[0].code == "13.00.00"
        assert results[1].code == "Z9.00.00"


# ---------------------------------------------------------------------------
# Test: technician_steps (list of strings) round-trips through JSON
# ---------------------------------------------------------------------------


def test_technician_steps_round_trip():
    steps = ["Inspect paper path", "Check sensor flag", "Replace pick roller"]
    with tempfile.TemporaryDirectory() as tmpdir:
        local = Path(tmpdir) / "error_solutions.json"
        local.write_text("[]", encoding="utf-8")

        with patch(
            "backend.infrastructure.repositories.error_solution_repository._LOCAL_PATH",
            local,
        ):
            repo = _make_repo(local)
            repo._upsert_local(_make_solution(technician_steps=steps))
            result = repo._get_by_model_and_code_local(MODEL_ID, "50.3F.FF")

        assert result is not None
        assert result.technician_steps == steps


# ---------------------------------------------------------------------------
# Test: frus (list of {part_number, description}) round-trips through JSON
# ---------------------------------------------------------------------------


def test_frus_round_trip():
    frus = [
        ErrorSolutionFru(part_number="RM1-1234", description="Fuser Assembly 110V"),
        ErrorSolutionFru(part_number="RM1-5678", description="Transfer Belt"),
    ]
    with tempfile.TemporaryDirectory() as tmpdir:
        local = Path(tmpdir) / "error_solutions.json"
        local.write_text("[]", encoding="utf-8")

        with patch(
            "backend.infrastructure.repositories.error_solution_repository._LOCAL_PATH",
            local,
        ):
            repo = _make_repo(local)
            repo._upsert_local(_make_solution(frus=frus))
            result = repo._get_by_model_and_code_local(MODEL_ID, "50.3F.FF")

        assert result is not None
        assert len(result.frus) == 2
        assert result.frus[0].part_number == "RM1-1234"
        assert result.frus[0].description == "Fuser Assembly 110V"
        assert result.frus[1].part_number == "RM1-5678"


# ---------------------------------------------------------------------------
# Test: empty technician_steps and frus default to empty lists
# ---------------------------------------------------------------------------


def test_empty_technician_steps_and_frus_default_to_empty_lists():
    with tempfile.TemporaryDirectory() as tmpdir:
        local = Path(tmpdir) / "error_solutions.json"
        local.write_text("[]", encoding="utf-8")

        with patch(
            "backend.infrastructure.repositories.error_solution_repository._LOCAL_PATH",
            local,
        ):
            repo = _make_repo(local)
            repo._upsert_local(_make_solution(technician_steps=[], frus=[]))
            result = repo._get_by_model_and_code_local(MODEL_ID, "50.3F.FF")

        assert result is not None
        assert result.technician_steps == []
        assert result.frus == []


# ---------------------------------------------------------------------------
# Test: corrupt JSON fallback file returns empty list from _load_local
# ---------------------------------------------------------------------------


def test_load_local_returns_empty_on_corrupt_json():
    with tempfile.NamedTemporaryFile(suffix=".json", mode="w", delete=False) as f:
        f.write("{invalid json}")
        tmp_path = Path(f.name)

    with patch(
        "backend.infrastructure.repositories.error_solution_repository._LOCAL_PATH",
        tmp_path,
    ):
        repo = ErrorSolutionRepository.__new__(ErrorSolutionRepository)
        result = repo._load_local()

    tmp_path.unlink(missing_ok=True)
    assert result == []
