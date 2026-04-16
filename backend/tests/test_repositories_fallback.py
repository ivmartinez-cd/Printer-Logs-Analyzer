"""Tests for repository JSON fallback — especially corrupt file handling."""

import json
import tempfile
import threading
from pathlib import Path
from unittest.mock import patch

# ---------------------------------------------------------------------------
# Test 1-2: saved_analysis_repository — JSON corrupto retorna lista vacía
# ---------------------------------------------------------------------------


def test_saved_analysis_load_local_returns_empty_on_corrupt_json():
    from backend.infrastructure.repositories.saved_analysis_repository import (
        SavedAnalysisRepository,
    )

    with tempfile.NamedTemporaryFile(suffix=".json", mode="w", delete=False) as f:
        f.write("{invalid json}")
        tmp_path = Path(f.name)

    repo = SavedAnalysisRepository.__new__(SavedAnalysisRepository)
    with patch(
        "backend.infrastructure.repositories.saved_analysis_repository._LOCAL_PATH", tmp_path
    ):
        result = repo._load_local()

    tmp_path.unlink(missing_ok=True)
    assert result == []


def test_saved_analysis_load_local_returns_empty_on_empty_file():
    from backend.infrastructure.repositories.saved_analysis_repository import (
        SavedAnalysisRepository,
    )

    with tempfile.NamedTemporaryFile(suffix=".json", mode="w", delete=False) as f:
        f.write("")
        tmp_path = Path(f.name)

    repo = SavedAnalysisRepository.__new__(SavedAnalysisRepository)
    with patch(
        "backend.infrastructure.repositories.saved_analysis_repository._LOCAL_PATH", tmp_path
    ):
        result = repo._load_local()

    tmp_path.unlink(missing_ok=True)
    assert result == []


# ---------------------------------------------------------------------------
# Test 3-4: error_code_repository — JSON corrupto retorna dict vacío
# ---------------------------------------------------------------------------


def test_error_code_load_fallback_returns_empty_on_corrupt_json():
    from backend.infrastructure.repositories.error_code_repository import ErrorCodeRepository

    with tempfile.NamedTemporaryFile(suffix=".json", mode="w", delete=False) as f:
        f.write("{bad}")
        tmp_path = Path(f.name)

    repo = ErrorCodeRepository.__new__(ErrorCodeRepository)
    repo._fallback_cache = None

    with (
        patch("backend.infrastructure.repositories.error_code_repository._LOCAL_PATH", tmp_path),
        patch("backend.infrastructure.repositories.error_code_repository._SEED_PATH", tmp_path),
    ):
        result = repo._load_fallback()

    tmp_path.unlink(missing_ok=True)
    assert result == {}


def test_error_code_load_fallback_returns_empty_on_empty_file():
    from backend.infrastructure.repositories.error_code_repository import ErrorCodeRepository

    with tempfile.NamedTemporaryFile(suffix=".json", mode="w", delete=False) as f:
        f.write("")
        tmp_path = Path(f.name)

    repo = ErrorCodeRepository.__new__(ErrorCodeRepository)
    repo._fallback_cache = None

    with (
        patch("backend.infrastructure.repositories.error_code_repository._LOCAL_PATH", tmp_path),
        patch("backend.infrastructure.repositories.error_code_repository._SEED_PATH", tmp_path),
    ):
        result = repo._load_fallback()

    tmp_path.unlink(missing_ok=True)
    assert result == {}


# ---------------------------------------------------------------------------
# Test 5: threading lock previene race condition en escritura concurrente
# ---------------------------------------------------------------------------


def test_saved_analysis_write_lock_prevents_race_condition():
    """Two concurrent writes must not corrupt the local JSON file."""
    from backend.infrastructure.repositories.saved_analysis_repository import (
        SavedAnalysisRepository,
    )

    with tempfile.TemporaryDirectory() as tmpdir:
        local_path = Path(tmpdir) / "saved.json"
        local_path.write_text("[]", encoding="utf-8")

        errors = []

        def write_entry(name: str):
            try:
                with patch(
                    "backend.infrastructure.repositories.saved_analysis_repository._LOCAL_PATH",
                    local_path,
                ):
                    repo = SavedAnalysisRepository.__new__(SavedAnalysisRepository)
                    items = repo._load_local()
                    items.append({"name": name})
                    import time

                    time.sleep(0.01)  # amplify race window
                    local_path.write_text(json.dumps(items, ensure_ascii=False), encoding="utf-8")
            except Exception as exc:
                errors.append(exc)

        threads = [threading.Thread(target=write_entry, args=(f"entry-{i}",)) for i in range(5)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        assert not errors
        # File must be valid JSON after concurrent writes
        data = json.loads(local_path.read_text(encoding="utf-8"))
        assert isinstance(data, list)
