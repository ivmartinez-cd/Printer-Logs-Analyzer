"""Tests para el endpoint POST /analysis/ai-diagnose."""

from __future__ import annotations

import os

# Establecer variables mínimas antes de importar api.py, ya que
# `app = get_app()` a nivel de módulo llama a get_settings() que requiere DB_URL.
os.environ.setdefault("DB_URL", "postgresql://test")
os.environ.setdefault("API_KEY", "dev")

from unittest.mock import AsyncMock, MagicMock, patch

from fastapi.testclient import TestClient

from backend.infrastructure.config import Settings
from backend.interface.api import get_app


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_settings(with_anthropic_key: bool = True) -> Settings:
    """Settings de prueba; ANTHROPIC_API_KEY presente solo si se pide.

    NOTE: API_KEY debe coincidir con os.environ.setdefault("API_KEY", "dev") de arriba,
    porque auth.py siempre llama a get_settings() que usa el caché del módulo.
    """
    kwargs: dict = {"DB_URL": "postgresql://test", "API_KEY": "dev"}
    if with_anthropic_key:
        kwargs["ANTHROPIC_API_KEY"] = "sk-ant-test"
    return Settings(**kwargs)


def _make_mock_anthropic_response(text: str) -> MagicMock:
    """Construye un response fake con la estructura de la SDK de Anthropic."""
    resp = MagicMock()
    resp.content = [MagicMock(text=text)]
    resp.usage.input_tokens = 300
    resp.usage.output_tokens = 50
    resp.usage.cache_creation_input_tokens = 10
    resp.usage.cache_read_input_tokens = 0
    return resp


_DIAGNOSIS_TEXT = (
    "DIAGNÓSTICO: El código 53.B0.02 domina con 15 ocurrencias en ráfagas.\n"
    "ACCIÓN: Reemplazar la unidad fusora.\n"
    "PRIORIDAD: alta"
)

_VALID_PAYLOAD = {
    "incidents": [
        {
            "code": "53.B0.02",
            "description": "Fuser error",
            "severity": "ERROR",
            "occurrences": 15,
            "start_time": "2024-03-14T10:00:00",
            "end_time": "2024-03-14T12:00:00",
            "pattern": "Rachas de hasta 5 eventos en 2h",
        }
    ],
    "global_severity": "ERROR",
    "metadata": {
        "total_events": 20,
        "date_range": "14-mar-2024 10:00 – 14-mar-2024 12:00",
        "firmware": "3.9.9",
        "counter_range": [100, 120],
    },
}

# "dev" coincide con API_KEY seteada vía os.environ.setdefault antes del import
_HEADERS = {"x-api-key": "dev"}


# ---------------------------------------------------------------------------
# Test 1: formato correcto cuando la API de Anthropic responde OK
# ---------------------------------------------------------------------------

@patch("backend.application.services.ai_diagnosis_service.AsyncAnthropic")
def test_ai_diagnose_returns_correct_format(MockAsyncAnthropic: MagicMock) -> None:
    """El endpoint retorna diagnosis, model, tokens_used y cost_usd en el formato correcto."""
    mock_instance = MagicMock()
    mock_instance.messages.create = AsyncMock(
        return_value=_make_mock_anthropic_response(_DIAGNOSIS_TEXT)
    )
    MockAsyncAnthropic.return_value = mock_instance

    client = TestClient(get_app(settings=_make_settings(with_anthropic_key=True)))
    response = client.post("/analysis/ai-diagnose", json=_VALID_PAYLOAD, headers=_HEADERS)

    assert response.status_code == 200
    data = response.json()

    # Campos obligatorios
    assert "diagnosis" in data
    assert "model" in data
    assert "tokens_used" in data
    assert "cost_usd" in data

    # Valores esperados
    assert data["diagnosis"] == _DIAGNOSIS_TEXT
    assert data["model"] == "claude-3-haiku-20240307"
    assert data["tokens_used"]["input"] == 300
    assert data["tokens_used"]["output"] == 50
    assert data["tokens_used"]["cache_write"] == 10
    assert data["tokens_used"]["cache_read"] == 0
    assert isinstance(data["cost_usd"], float)
    assert data["cost_usd"] > 0.0

    # El cliente recibe la API key correcta
    MockAsyncAnthropic.assert_called_once_with(api_key="sk-ant-test")


# ---------------------------------------------------------------------------
# Test 2: retorna 503 cuando ANTHROPIC_API_KEY no está configurada
# ---------------------------------------------------------------------------

def test_ai_diagnose_returns_503_when_no_api_key() -> None:
    """El endpoint retorna 503 si ANTHROPIC_API_KEY no está configurada."""
    client = TestClient(
        get_app(settings=_make_settings(with_anthropic_key=False)),
        raise_server_exceptions=False,
    )
    response = client.post("/analysis/ai-diagnose", json=_VALID_PAYLOAD, headers=_HEADERS)
    assert response.status_code == 503
    assert "ANTHROPIC_API_KEY" in response.json()["detail"]


# ---------------------------------------------------------------------------
# Test 3: retorna 401 con x-api-key incorrecta / 422 si falta el header
# ---------------------------------------------------------------------------

def test_ai_diagnose_rejects_wrong_api_key() -> None:
    """El endpoint retorna 401 si x-api-key es incorrecta."""
    client = TestClient(
        get_app(settings=_make_settings(with_anthropic_key=True)),
        raise_server_exceptions=False,
    )
    response = client.post(
        "/analysis/ai-diagnose",
        json=_VALID_PAYLOAD,
        headers={"x-api-key": "wrong-key"},
    )
    assert response.status_code == 401


def test_ai_diagnose_missing_header_returns_422() -> None:
    """El endpoint retorna 422 si falta el header x-api-key (FastAPI lo requiere)."""
    client = TestClient(
        get_app(settings=_make_settings(with_anthropic_key=True)),
        raise_server_exceptions=False,
    )
    response = client.post("/analysis/ai-diagnose", json=_VALID_PAYLOAD)
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# Test 4: payload sin metadata funciona igual
# ---------------------------------------------------------------------------

@patch("backend.application.services.ai_diagnosis_service.AsyncAnthropic")
def test_ai_diagnose_without_metadata(MockAsyncAnthropic: MagicMock) -> None:
    """El endpoint acepta payload sin el campo metadata."""
    mock_instance = MagicMock()
    mock_instance.messages.create = AsyncMock(
        return_value=_make_mock_anthropic_response(_DIAGNOSIS_TEXT)
    )
    MockAsyncAnthropic.return_value = mock_instance

    payload_sin_metadata = {k: v for k, v in _VALID_PAYLOAD.items() if k != "metadata"}
    client = TestClient(get_app(settings=_make_settings()))
    response = client.post("/analysis/ai-diagnose", json=payload_sin_metadata, headers=_HEADERS)

    assert response.status_code == 200
    assert response.json()["diagnosis"] == _DIAGNOSIS_TEXT
