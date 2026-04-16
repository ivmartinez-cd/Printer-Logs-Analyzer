"""Tests para los endpoints GET /printer-models y POST /printer-models/upload-pdf."""

from __future__ import annotations

import os
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import UUID

os.environ.setdefault("DB_URL", "postgresql://test")
os.environ.setdefault("API_KEY", "dev")

import psycopg2.errors
import pytest
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def no_rate_limit(monkeypatch: pytest.MonkeyPatch) -> None:
    """Disable slowapi rate limiting for all tests in this module.

    Each test calls get_app() which re-registers the inner function with the
    same __name__; the module-level limiter accumulates hits across test runs
    and triggers 429 prematurely. Patching limiter.limit to an identity
    decorator prevents that while still exercising the endpoint logic.
    """
    from backend.interface.rate_limiter import limiter

    monkeypatch.setattr(limiter, "limit", lambda *args, **kwargs: lambda f: f)


from backend.domain.entities import PrinterModel
from backend.infrastructure.config import Settings
from backend.interface.api import get_app

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_HEADERS = {"x-api-key": "dev"}

_NOW = datetime(2024, 3, 14, 10, 0, 0, tzinfo=timezone.utc)

_UUID_1 = UUID("11111111-1111-1111-1111-111111111111")
_UUID_2 = UUID("22222222-2222-2222-2222-222222222222")


def _make_settings(with_anthropic_key: bool = True) -> Settings:
    kwargs: dict = {"DB_URL": "postgresql://test", "API_KEY": "dev"}
    if with_anthropic_key:
        kwargs["ANTHROPIC_API_KEY"] = "sk-ant-test"
    return Settings(**kwargs)


def _make_printer_model(model_code: str = "E60055", model_id: UUID = _UUID_1) -> PrinterModel:
    return PrinterModel(
        id=model_id,
        model_name=f"HP LaserJet Managed {model_code}",
        model_code=model_code,
        family="E600xx",
        ampv=3500,
        engine_life_pages=1_350_000,
        notes=None,
        created_at=_NOW,
        updated_at=_NOW,
    )


_VALID_PDF_BYTES = b"%PDF-1.4 fake pdf content"

_EXTRACTED_TWO_MODELS = {
    "models": [
        {
            "model_name": "HP LaserJet Managed E60055",
            "model_code": "E60055",
            "family": "E600xx",
            "ampv": 3500,
            "engine_life_pages": 1_350_000,
            "notes": None,
            "consumables": [
                {
                    "part_number": "J8J70-67903",
                    "sku": "J8J70A",
                    "description": "Tray 1 roller kit",
                    "category": "roller",
                    "life_pages": 150_000,
                    "mttr_minutes": 10,
                    "voltage": None,
                    "related_codes": ["53.B0.0z", "53.B1.0z"],
                }
            ],
        },
        {
            "model_name": "HP LaserJet Managed E60065",
            "model_code": "E60065",
            "family": "E600xx",
            "ampv": 5000,
            "engine_life_pages": 1_350_000,
            "notes": None,
            "consumables": [],
        },
    ]
}


# ---------------------------------------------------------------------------
# GET /printer-models
# ---------------------------------------------------------------------------


@patch(
    "backend.infrastructure.repositories.printer_model_repository.PrinterModelRepository.list_models",
    return_value=[],
)
def test_list_printer_models_empty(mock_list: MagicMock) -> None:
    """GET /printer-models retorna lista vacía cuando no hay modelos."""
    client = TestClient(get_app(settings=_make_settings()))
    response = client.get("/printer-models", headers=_HEADERS)

    assert response.status_code == 200
    assert response.json() == []
    mock_list.assert_called_once()


# ---------------------------------------------------------------------------
# POST /printer-models/upload-pdf — validaciones de entrada
# ---------------------------------------------------------------------------


def test_upload_pdf_rejects_non_pdf_content_type() -> None:
    """Retorna 400 si el content_type no es application/pdf."""
    client = TestClient(get_app(settings=_make_settings()), raise_server_exceptions=False)
    response = client.post(
        "/printer-models/upload-pdf",
        files={"file": ("doc.txt", b"texto plano", "text/plain")},
        headers=_HEADERS,
    )
    assert response.status_code == 400
    assert "PDF" in response.json()["detail"]


def test_upload_pdf_rejects_oversized_file() -> None:
    """Retorna 400 si el archivo supera 10 MB."""
    big_pdf = b"0" * (10 * 1024 * 1024 + 1)
    client = TestClient(get_app(settings=_make_settings()), raise_server_exceptions=False)
    response = client.post(
        "/printer-models/upload-pdf",
        files={"file": ("big.pdf", big_pdf, "application/pdf")},
        headers=_HEADERS,
    )
    assert response.status_code == 400
    assert "10 MB" in response.json()["detail"]


def test_upload_pdf_returns_503_when_no_api_key() -> None:
    """Retorna 503 si ANTHROPIC_API_KEY no está configurada."""
    client = TestClient(
        get_app(settings=_make_settings(with_anthropic_key=False)),
        raise_server_exceptions=False,
    )
    response = client.post(
        "/printer-models/upload-pdf",
        files={"file": ("test.pdf", _VALID_PDF_BYTES, "application/pdf")},
        headers=_HEADERS,
    )
    assert response.status_code == 503
    assert "ANTHROPIC_API_KEY" in response.json()["detail"]


# ---------------------------------------------------------------------------
# POST /printer-models/upload-pdf — flujos exitosos
# ---------------------------------------------------------------------------


@patch(
    "backend.interface.routers.printers.extract_model_from_pdf",
    new_callable=AsyncMock,
)
@patch(
    "backend.infrastructure.repositories.printer_model_repository.PrinterModelRepository.create_with_consumables",
)
def test_upload_pdf_success_creates_models(
    mock_create: MagicMock,
    mock_extract: AsyncMock,
) -> None:
    """Crea ambos modelos del JSON extraído y retorna el resumen correcto."""
    mock_extract.return_value = _EXTRACTED_TWO_MODELS
    mock_create.side_effect = [
        _make_printer_model("E60055", _UUID_1),
        _make_printer_model("E60065", _UUID_2),
    ]

    client = TestClient(get_app(settings=_make_settings()))
    response = client.post(
        "/printer-models/upload-pdf",
        files={"file": ("scd.pdf", _VALID_PDF_BYTES, "application/pdf")},
        headers=_HEADERS,
    )

    assert response.status_code == 200
    data = response.json()
    assert set(data["created"]) == {"E60055", "E60065"}
    assert data["skipped"] == []
    # E60055 tiene 1 consumible; E60065 tiene 0
    assert data["total_consumables"] == 1
    assert mock_create.call_count == 2


@patch(
    "backend.interface.routers.printers.extract_model_from_pdf",
    new_callable=AsyncMock,
)
@patch(
    "backend.infrastructure.repositories.printer_model_repository.PrinterModelRepository.create_with_consumables",
)
def test_upload_pdf_skips_duplicate_model_codes(
    mock_create: MagicMock,
    mock_extract: AsyncMock,
) -> None:
    """El primer modelo falla por UniqueViolation → va a skipped; el segundo se crea."""
    mock_extract.return_value = _EXTRACTED_TWO_MODELS
    mock_create.side_effect = [
        psycopg2.errors.UniqueViolation(),
        _make_printer_model("E60065", _UUID_2),
    ]

    client = TestClient(get_app(settings=_make_settings()), raise_server_exceptions=False)
    response = client.post(
        "/printer-models/upload-pdf",
        files={"file": ("scd.pdf", _VALID_PDF_BYTES, "application/pdf")},
        headers=_HEADERS,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["created"] == ["E60065"]
    assert data["skipped"] == ["E60055"]
    assert data["total_consumables"] == 0


# ---------------------------------------------------------------------------
# POST /printer-models/upload-pdf — errores de Claude
# ---------------------------------------------------------------------------


@patch(
    "backend.interface.routers.printers.extract_model_from_pdf",
    new_callable=AsyncMock,
)
def test_upload_pdf_returns_422_on_invalid_json_from_claude(
    mock_extract: AsyncMock,
) -> None:
    """Retorna 422 si extract_model_from_pdf lanza ValueError (JSON inválido de Claude)."""
    mock_extract.side_effect = ValueError("Claude devolvió JSON inválido: ...")

    client = TestClient(get_app(settings=_make_settings()), raise_server_exceptions=False)
    response = client.post(
        "/printer-models/upload-pdf",
        files={"file": ("scd.pdf", _VALID_PDF_BYTES, "application/pdf")},
        headers=_HEADERS,
    )

    assert response.status_code == 422
    assert "JSON inválido" in response.json()["detail"]
