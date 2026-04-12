"""Unit tests for cpmd_extractor.extract_solution."""

from __future__ import annotations

import json
from unittest.mock import MagicMock, patch

import pytest

from backend.application.services.cpmd_parser import ErrorBlock
from backend.application.services.cpmd_extractor import ExtractedSolution, extract_solution

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_DUMMY_API_KEY = "sk-ant-test-key"

_VALID_BLOCK = ErrorBlock(
    code="13.B2.00",
    raw_title="Paper jam in Tray 1",
    raw_text=(
        "\n13.B2.00 Paper jam in Tray 1\n"
        "Worn pickup roller.\n\n"
        "Recommended action for service\n"
        "1. Replace the roller (CE538-67905).\n"
    ),
    source_audience="service",
    source_page=5,
)

_VALID_JSON_RESPONSE = json.dumps(
    {
        "code": "13.B2.00",
        "title": "Atasco de papel en Bandeja 1",
        "cause": "El rodillo de alimentación desgastado no puede agarrar el papel.",
        "technician_steps": [
            "Retirar la bandeja e inspeccionar el rodillo.",
            "Reemplazar el rodillo si está desgastado (CE538-67905).",
            "Imprimir una página de prueba.",
        ],
        "frus": [{"part_number": "CE538-67905", "description": "Kit de rodillo Bandeja 1"}],
    }
)


def _make_api_response(text: str) -> MagicMock:
    """Build a minimal mock that mimics anthropic.types.Message."""
    content_block = MagicMock()
    content_block.text = text
    msg = MagicMock()
    msg.content = [content_block]
    return msg


# ---------------------------------------------------------------------------
# Tests — valid response
# ---------------------------------------------------------------------------


@patch("backend.application.services.cpmd_extractor.Anthropic")
def test_valid_json_maps_to_extracted_solution(mock_anthropic_cls: MagicMock) -> None:
    """A well-formed JSON response produces a populated ExtractedSolution."""
    mock_client = MagicMock()
    mock_client.messages.create.return_value = _make_api_response(_VALID_JSON_RESPONSE)
    mock_anthropic_cls.return_value = mock_client

    result = extract_solution(_VALID_BLOCK, _DUMMY_API_KEY)

    assert result is not None
    assert isinstance(result, ExtractedSolution)
    assert result.code == "13.B2.00"
    assert result.title == "Atasco de papel en Bandeja 1"
    assert len(result.technician_steps) == 3
    assert len(result.frus) == 1
    assert result.frus[0]["part_number"] == "CE538-67905"


@patch("backend.application.services.cpmd_extractor.Anthropic")
def test_empty_frus_and_steps_are_accepted(mock_anthropic_cls: MagicMock) -> None:
    """Response with empty arrays for frus/steps is still valid."""
    response_text = json.dumps(
        {
            "code": "13.B2.00",
            "title": "Paper jam",
            "cause": "Roller worn out.",
            "technician_steps": [],
            "frus": [],
        }
    )
    mock_client = MagicMock()
    mock_client.messages.create.return_value = _make_api_response(response_text)
    mock_anthropic_cls.return_value = mock_client

    result = extract_solution(_VALID_BLOCK, _DUMMY_API_KEY)

    assert result is not None
    assert result.technician_steps == []
    assert result.frus == []


# ---------------------------------------------------------------------------
# Tests — malformed response
# ---------------------------------------------------------------------------


@patch("backend.application.services.cpmd_extractor.Anthropic")
def test_invalid_json_returns_none_and_logs_warning(
    mock_anthropic_cls: MagicMock, caplog: pytest.LogCaptureFixture
) -> None:
    """Non-JSON response on both attempts must return None and log a WARNING."""
    malformed = "Lo siento, no puedo procesar este bloque en este momento."
    mock_client = MagicMock()
    mock_client.messages.create.return_value = _make_api_response(malformed)
    mock_anthropic_cls.return_value = mock_client

    import logging

    with caplog.at_level(logging.WARNING, logger="backend.application.services.cpmd_extractor"):
        result = extract_solution(_VALID_BLOCK, _DUMMY_API_KEY)

    assert result is None
    assert any("JSON" in r.message or "inválido" in r.message for r in caplog.records)


@patch("backend.application.services.cpmd_extractor.Anthropic")
def test_missing_required_field_returns_none(mock_anthropic_cls: MagicMock) -> None:
    """JSON missing a required field ('cause') must return None."""
    bad_shape = json.dumps(
        {
            "code": "13.B2.00",
            "title": "Paper jam",
            # 'cause' is missing
            "technician_steps": ["Step 1"],
            "frus": [],
        }
    )
    mock_client = MagicMock()
    mock_client.messages.create.return_value = _make_api_response(bad_shape)
    mock_anthropic_cls.return_value = mock_client

    result = extract_solution(_VALID_BLOCK, _DUMMY_API_KEY)

    assert result is None


@patch("backend.application.services.cpmd_extractor.Anthropic")
def test_api_exception_returns_none(mock_anthropic_cls: MagicMock) -> None:
    """When the Anthropic API raises an exception, extract_solution returns None."""
    mock_client = MagicMock()
    mock_client.messages.create.side_effect = RuntimeError("network error")
    mock_anthropic_cls.return_value = mock_client

    result = extract_solution(_VALID_BLOCK, _DUMMY_API_KEY)

    assert result is None


@patch("backend.application.services.cpmd_extractor.Anthropic")
def test_retry_succeeds_on_second_attempt(mock_anthropic_cls: MagicMock) -> None:
    """If the first call returns bad JSON but the retry returns valid JSON, result is not None."""
    malformed = "not json at all"
    mock_client = MagicMock()
    mock_client.messages.create.side_effect = [
        _make_api_response(malformed),
        _make_api_response(_VALID_JSON_RESPONSE),
    ]
    mock_anthropic_cls.return_value = mock_client

    result = extract_solution(_VALID_BLOCK, _DUMMY_API_KEY)

    assert result is not None
    assert result.code == "13.B2.00"
