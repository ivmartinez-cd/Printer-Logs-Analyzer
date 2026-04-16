"""Tests for log metadata (dates and totals) in the /parser/preview endpoint."""

import os
from unittest.mock import patch

os.environ.setdefault("DB_URL", "postgresql://test")
os.environ.setdefault("API_KEY", "dev")

import pytest
from backend.infrastructure.config import Settings
from backend.interface.api import get_app
from fastapi.testclient import TestClient

_HEADERS = {"x-api-key": "dev"}


def _make_settings() -> Settings:
    return Settings(DB_URL="postgresql://test", API_KEY="dev")


@pytest.fixture(autouse=True)
def no_rate_limit(monkeypatch: pytest.MonkeyPatch) -> None:
    from backend.interface.api import limiter

    monkeypatch.setattr(limiter, "limit", lambda *args, **kwargs: lambda f: f)


def test_parse_logs_metadata_is_correct() -> None:
    """Verifies that start_date, end_date and total_lines are correctly returned."""
    # Two events: one in March 14, one in March 15.
    log_text = (
        "type\tcode\tfecha\thora\tcounter\tfirmware\n"
        "Error\tE1\t14-mar-2024 10:00:00\t100\tv1\n"
        "Info\tI1\t15-mar-2024 10:00:00\t200\tv1\n"
    )

    # We mock DB and other services to focus on API mapping
    with patch(
        "backend.infrastructure.repositories.error_code_repository.ErrorCodeRepository.get_by_codes",
        return_value={},
    ):
        client = TestClient(get_app(settings=_make_settings()))
        response = client.post("/parser/preview", json={"logs": log_text}, headers=_HEADERS)

        assert response.status_code == 200
        data = response.json()

        # log_start_date should be the timestamp of the first event
        # 14-mar-2024 10:00:00 -> 2024-03-14T10:00:00
        assert "2024-03-14T10:00:00" in data["log_start_date"]
        # log_end_date should be the timestamp of the last event
        assert "2024-03-15T10:00:00" in data["log_end_date"]

        # total_lines count (including header and events)
        # raw lines: header + 2 events = 3 lines
        assert data["total_lines"] == 3


def test_parse_logs_empty_metadata_fallback() -> None:
    """Verifies that empty logs still return valid dates (now)."""
    client = TestClient(get_app(settings=_make_settings()))
    response = client.post("/parser/preview", json={"logs": ""}, headers=_HEADERS)

    assert response.status_code == 200
    data = response.json()
    assert data["log_start_date"] is not None
    assert data["log_end_date"] is not None
    assert data["total_lines"] == 0
