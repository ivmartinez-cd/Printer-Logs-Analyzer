"""Tests for GET /models/{model_id}/error-solutions/{code}
and has_cpmd flag in GET /printer-models."""

from __future__ import annotations

import os
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch
from uuid import UUID

os.environ.setdefault("DB_URL", "postgresql://test")
os.environ.setdefault("API_KEY", "dev")

import pytest
from fastapi.testclient import TestClient

from backend.domain.entities import ErrorSolution, ErrorSolutionFru, PrinterModel
from backend.infrastructure.config import Settings
from backend.interface.api import get_app

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_HEADERS = {"x-api-key": "dev"}
_NOW = datetime(2024, 3, 14, 10, 0, 0, tzinfo=timezone.utc)
_MODEL_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
_MODEL_ID_STR = str(_MODEL_ID)
_CODE = "49.FF.09"


def _make_settings() -> Settings:
    return Settings(DB_URL="postgresql://test", API_KEY="dev")


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


def _make_solution() -> ErrorSolution:
    return ErrorSolution(
        id=1,
        model_id=_MODEL_ID,
        code=_CODE,
        title="Formatter error",
        cause="Firmware corruption",
        technician_steps=["Power cycle the device", "Reinstall firmware"],
        frus=[ErrorSolutionFru(part_number="CF234A", description="Formatter PCA")],
        source_audience="service",
        source_page=42,
        cpmd_hash="abc123",
        created_at=_NOW,
    )


@pytest.fixture(autouse=True)
def no_rate_limit(monkeypatch: pytest.MonkeyPatch) -> None:
    from backend.interface.api import limiter
    monkeypatch.setattr(limiter, "limit", lambda *args, **kwargs: lambda f: f)


# ---------------------------------------------------------------------------
# GET /models/{model_id}/error-solutions/{code}
# ---------------------------------------------------------------------------


@patch(
    "backend.infrastructure.repositories.printer_model_repository.PrinterModelRepository.get_by_id",
)
@patch(
    "backend.infrastructure.repositories.error_solution_repository.ErrorSolutionRepository.get_by_model_and_code",
)
def test_get_error_solution_returns_200(
    mock_get_sol: MagicMock, mock_get_model: MagicMock
) -> None:
    """Returns 200 with full solution when both model and solution exist."""
    mock_get_model.return_value = _make_printer_model()
    mock_get_sol.return_value = _make_solution()

    client = TestClient(get_app(settings=_make_settings()))
    response = client.get(f"/models/{_MODEL_ID_STR}/error-solutions/{_CODE}", headers=_HEADERS)

    assert response.status_code == 200
    data = response.json()
    assert data["code"] == _CODE
    assert data["cause"] == "Firmware corruption"
    assert data["technician_steps"] == ["Power cycle the device", "Reinstall firmware"]
    assert data["frus"] == [{"part_number": "CF234A", "description": "Formatter PCA"}]
    assert data["source_page"] == 42
    assert data["source_audience"] == "service"


@patch(
    "backend.infrastructure.repositories.printer_model_repository.PrinterModelRepository.get_by_id",
)
@patch(
    "backend.infrastructure.repositories.error_solution_repository.ErrorSolutionRepository.get_by_model_and_code",
)
def test_get_error_solution_404_when_code_not_found(
    mock_get_sol: MagicMock, mock_get_model: MagicMock
) -> None:
    """Returns 404 when model exists but code has no solution."""
    mock_get_model.return_value = _make_printer_model()
    mock_get_sol.return_value = None

    client = TestClient(get_app(settings=_make_settings()))
    response = client.get(
        f"/models/{_MODEL_ID_STR}/error-solutions/99.XX.XX", headers=_HEADERS
    )

    assert response.status_code == 404


@patch(
    "backend.infrastructure.repositories.printer_model_repository.PrinterModelRepository.get_by_id",
)
def test_get_error_solution_404_when_model_not_found(mock_get_model: MagicMock) -> None:
    """Returns 404 when model does not exist."""
    mock_get_model.return_value = None

    client = TestClient(get_app(settings=_make_settings()))
    response = client.get(
        f"/models/{_MODEL_ID_STR}/error-solutions/{_CODE}", headers=_HEADERS
    )

    assert response.status_code == 404


def test_get_error_solution_400_invalid_model_id() -> None:
    """Returns 400 for a non-UUID model_id."""
    client = TestClient(get_app(settings=_make_settings()), raise_server_exceptions=False)
    response = client.get(
        "/models/not-a-uuid/error-solutions/49.FF.09", headers=_HEADERS
    )
    assert response.status_code == 400


def test_get_error_solution_requires_auth() -> None:
    """Returns 4xx without x-api-key (401 if key wrong, 422 if key missing)."""
    client = TestClient(get_app(settings=_make_settings()), raise_server_exceptions=False)
    response = client.get(f"/models/{_MODEL_ID_STR}/error-solutions/{_CODE}")
    assert response.status_code in (401, 422)


# ---------------------------------------------------------------------------
# GET /printer-models — has_cpmd flag
# ---------------------------------------------------------------------------


@patch(
    "backend.infrastructure.repositories.printer_model_repository.PrinterModelRepository.list_models",
)
@patch(
    "backend.infrastructure.repositories.error_solution_repository.ErrorSolutionRepository.get_model_ids_with_solutions",
)
def test_list_printer_models_has_cpmd_true(
    mock_ids: MagicMock, mock_list: MagicMock
) -> None:
    """Model with solutions gets has_cpmd=True."""
    mock_list.return_value = [_make_printer_model()]
    mock_ids.return_value = {_MODEL_ID_STR}

    client = TestClient(get_app(settings=_make_settings()))
    response = client.get("/printer-models", headers=_HEADERS)

    assert response.status_code == 200
    models = response.json()
    assert len(models) == 1
    assert models[0]["has_cpmd"] is True


@patch(
    "backend.infrastructure.repositories.printer_model_repository.PrinterModelRepository.list_models",
)
@patch(
    "backend.infrastructure.repositories.error_solution_repository.ErrorSolutionRepository.get_model_ids_with_solutions",
)
def test_list_printer_models_has_cpmd_false(
    mock_ids: MagicMock, mock_list: MagicMock
) -> None:
    """Model without solutions gets has_cpmd=False."""
    mock_list.return_value = [_make_printer_model()]
    mock_ids.return_value = set()

    client = TestClient(get_app(settings=_make_settings()))
    response = client.get("/printer-models", headers=_HEADERS)

    assert response.status_code == 200
    models = response.json()
    assert models[0]["has_cpmd"] is False
