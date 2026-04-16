"""Tests for POST /models/{model_id}/cpmd endpoint."""

from __future__ import annotations

import hashlib
import os
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch
from uuid import UUID

os.environ.setdefault("DB_URL", "postgresql://test")
os.environ.setdefault("API_KEY", "dev")

import pytest
from backend.application.services.cpmd_ingest import IngestReport
from backend.domain.entities import PrinterModel
from backend.infrastructure.config import Settings
from backend.interface.api import get_app
from fastapi.testclient import TestClient

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_HEADERS = {"x-api-key": "dev"}
_MODEL_ID = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
_MODEL_ID_STR = str(_MODEL_ID)
_FAKE_PDF = b"%PDF-1.4 fake cpmd content"
_FAKE_HASH = hashlib.sha256(_FAKE_PDF).hexdigest()
_NOW = datetime(2024, 3, 14, 10, 0, 0, tzinfo=timezone.utc)


@pytest.fixture(autouse=True)
def no_rate_limit(monkeypatch: pytest.MonkeyPatch) -> None:
    from backend.interface.rate_limiter import limiter

    monkeypatch.setattr(limiter, "limit", lambda *args, **kwargs: lambda f: f)


def _make_settings(with_anthropic_key: bool = True) -> Settings:
    kwargs: dict = {"DB_URL": "postgresql://test", "API_KEY": "dev"}
    if with_anthropic_key:
        kwargs["ANTHROPIC_API_KEY"] = "sk-ant-test"
    return Settings(**kwargs)


def _make_printer_model() -> PrinterModel:
    return PrinterModel(
        id=_MODEL_ID,
        model_name="HP LaserJet Managed E60175",
        model_code="E60175",
        family="E600xx",
        ampv=7500,
        engine_life_pages=2_000_000,
        notes=None,
        created_at=_NOW,
        updated_at=_NOW,
    )


def _make_ingest_report(skipped: bool = False) -> IngestReport:
    return IngestReport(
        model_ids=[_MODEL_ID],
        cpmd_hash=_FAKE_HASH,
        total_blocks=10,
        regex_ok=7,
        llm_ok=1,
        failed=2,
        skipped=skipped,
        reason="Ya procesado" if skipped else "",
    )


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------


def test_missing_api_key_returns_4xx() -> None:
    """Request without x-api-key header must be rejected.

    FastAPI returns 422 (missing required header) when the x-api-key header
    is absent entirely — consistent with all other protected endpoints.
    A wrong key returns 401; a missing key returns 422.
    """
    client = TestClient(get_app(settings=_make_settings()), raise_server_exceptions=False)
    response = client.post(
        f"/models/{_MODEL_ID_STR}/cpmd",
        files={"file": ("cpmd.pdf", _FAKE_PDF, "application/pdf")},
    )
    assert response.status_code in (401, 422)


# ---------------------------------------------------------------------------
# Validation errors
# ---------------------------------------------------------------------------


@patch(
    "backend.infrastructure.repositories.printer_model_repository.PrinterModelRepository.get_by_id",
    return_value=None,
)
def test_unknown_model_id_returns_404(mock_get: MagicMock) -> None:
    """Non-existent model_id must return 404."""
    client = TestClient(get_app(settings=_make_settings()), raise_server_exceptions=False)
    response = client.post(
        f"/models/{_MODEL_ID_STR}/cpmd",
        files={"file": ("cpmd.pdf", _FAKE_PDF, "application/pdf")},
        headers=_HEADERS,
    )
    assert response.status_code == 404
    assert "Modelo" in response.json()["detail"]


@patch(
    "backend.infrastructure.repositories.printer_model_repository.PrinterModelRepository.get_by_id",
    return_value=_make_printer_model(),
)
def test_non_pdf_file_returns_400(mock_get: MagicMock) -> None:
    """Uploading a non-PDF file must return 400."""
    client = TestClient(get_app(settings=_make_settings()), raise_server_exceptions=False)
    response = client.post(
        f"/models/{_MODEL_ID_STR}/cpmd",
        files={"file": ("document.txt", b"not a pdf", "text/plain")},
        headers=_HEADERS,
    )
    assert response.status_code == 400
    assert "PDF" in response.json()["detail"]


@patch(
    "backend.infrastructure.repositories.printer_model_repository.PrinterModelRepository.get_by_id",
    return_value=_make_printer_model(),
)
def test_oversized_pdf_returns_413(mock_get: MagicMock) -> None:
    """PDF exceeding 20 MB must return 413."""
    big_pdf = b"0" * (20 * 1024 * 1024 + 1)
    client = TestClient(get_app(settings=_make_settings()), raise_server_exceptions=False)
    response = client.post(
        f"/models/{_MODEL_ID_STR}/cpmd",
        files={"file": ("big.pdf", big_pdf, "application/pdf")},
        headers=_HEADERS,
    )
    assert response.status_code == 413
    assert "20 MB" in response.json()["detail"]


@patch(
    "backend.infrastructure.repositories.printer_model_repository.PrinterModelRepository.get_by_id",
    return_value=_make_printer_model(),
)
def test_missing_anthropic_key_returns_503(mock_get: MagicMock) -> None:
    """Missing ANTHROPIC_API_KEY must return 503 before the file is processed."""
    client = TestClient(
        get_app(settings=_make_settings(with_anthropic_key=False)),
        raise_server_exceptions=False,
    )
    response = client.post(
        f"/models/{_MODEL_ID_STR}/cpmd",
        files={"file": ("cpmd.pdf", _FAKE_PDF, "application/pdf")},
        headers=_HEADERS,
    )
    assert response.status_code == 503
    assert "ANTHROPIC_API_KEY" in response.json()["detail"]


# ---------------------------------------------------------------------------
# Happy path
# ---------------------------------------------------------------------------


@patch(
    "backend.infrastructure.repositories.printer_model_repository.PrinterModelRepository.get_by_id",
)
@patch("backend.interface.routers.printers.ingest_cpmd")
def test_happy_path_returns_ingest_report(
    mock_ingest: MagicMock,
    mock_get_model: MagicMock,
) -> None:
    """Successful upload returns the IngestReport fields as JSON."""
    mock_get_model.return_value = _make_printer_model()
    mock_ingest.return_value = _make_ingest_report(skipped=False)

    client = TestClient(get_app(settings=_make_settings()))
    response = client.post(
        f"/models/{_MODEL_ID_STR}/cpmd",
        files={"file": ("cpmd.pdf", _FAKE_PDF, "application/pdf")},
        headers=_HEADERS,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["model_id"] == _MODEL_ID_STR
    assert data["cpmd_hash"] == _FAKE_HASH
    assert data["total_blocks"] == 10
    assert data["extracted"] == 8  # regex_ok(7) + llm_ok(1)
    assert data["regex_ok"] == 7
    assert data["llm_ok"] == 1
    assert data["failed"] == 2
    assert data["skipped"] is False


@patch(
    "backend.infrastructure.repositories.printer_model_repository.PrinterModelRepository.get_by_id",
)
@patch("backend.interface.routers.printers.ingest_cpmd")
def test_skipped_report_is_returned_correctly(
    mock_ingest: MagicMock,
    mock_get_model: MagicMock,
) -> None:
    """When ingest returns skipped=True, the endpoint still returns 200 with skipped=True."""
    mock_get_model.return_value = _make_printer_model()
    mock_ingest.return_value = _make_ingest_report(skipped=True)

    client = TestClient(get_app(settings=_make_settings()))
    response = client.post(
        f"/models/{_MODEL_ID_STR}/cpmd",
        files={"file": ("cpmd.pdf", _FAKE_PDF, "application/pdf")},
        headers=_HEADERS,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["skipped"] is True
    assert data["reason"] == "Ya procesado"


@patch(
    "backend.infrastructure.repositories.printer_model_repository.PrinterModelRepository.get_by_id",
)
@patch("backend.interface.routers.printers.ingest_cpmd")
def test_pdf_extension_without_content_type_is_accepted(
    mock_ingest: MagicMock,
    mock_get_model: MagicMock,
) -> None:
    """A file with .pdf extension but generic content-type should be accepted."""
    mock_get_model.return_value = _make_printer_model()
    mock_ingest.return_value = _make_ingest_report()

    client = TestClient(get_app(settings=_make_settings()))
    response = client.post(
        f"/models/{_MODEL_ID_STR}/cpmd",
        # content_type set to octet-stream but filename ends in .pdf
        files={"file": ("cpmd.pdf", _FAKE_PDF, "application/octet-stream")},
        headers=_HEADERS,
    )

    assert response.status_code == 200
