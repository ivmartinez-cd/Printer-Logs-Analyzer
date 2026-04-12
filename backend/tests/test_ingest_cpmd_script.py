"""Tests for backend.scripts.ingest_cpmd CLI script."""

from __future__ import annotations

from unittest.mock import patch

import pytest

from backend.scripts.ingest_cpmd import main
from backend.application.services.cpmd_parser import ErrorBlock


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_blocks(n_service: int = 2, n_customers: int = 1) -> list[ErrorBlock]:
    blocks = []
    for i in range(n_service):
        blocks.append(
            ErrorBlock(
                code=f"13.B{i}.00",
                raw_title="Paper jam",
                raw_text="13.B0.00\nRecommended action for service\n1. Replace roller.",
                source_audience="service",
                source_page=i + 1,
            )
        )
    for i in range(n_customers):
        blocks.append(
            ErrorBlock(
                code=f"50.0{i}.00",
                raw_title="Fuser error",
                raw_text="50.00.00\nRecommended action for customers\n1. Call service.",
                source_audience="customers",
                source_page=n_service + i + 1,
            )
        )
    return blocks


# ---------------------------------------------------------------------------
# --dry-run
# ---------------------------------------------------------------------------


def test_dry_run_shows_block_counts(tmp_path: pytest.TempPathFactory, capsys) -> None:
    """--dry-run must print block counts and estimated cost without touching DB or Haiku."""
    pdf = tmp_path / "test.pdf"
    pdf.write_bytes(b"%PDF-1.4 fake content")

    blocks = _make_blocks(n_service=2, n_customers=1)

    with patch(
        "backend.application.services.cpmd_parser.extract_error_blocks",
        return_value=blocks,
    ):
        main(argv=["--model-id", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "--pdf", str(pdf), "--dry-run"])

    captured = capsys.readouterr()
    assert "Bloques detectados: 3" in captured.out
    assert "Con sección 'service':   2" in captured.out
    assert "Con sección 'customers': 1" in captured.out
    assert "Costo estimado total:" in captured.out
    assert "0.0054" in captured.out  # 3 * 0.0018


def test_dry_run_zero_blocks(tmp_path: pytest.TempPathFactory, capsys) -> None:
    """--dry-run with an empty PDF (no blocks) must show 0 and $0.0000."""
    pdf = tmp_path / "empty.pdf"
    pdf.write_bytes(b"%PDF-1.4 no blocks here")

    with patch(
        "backend.application.services.cpmd_parser.extract_error_blocks",
        return_value=[],
    ):
        main(argv=["--model-id", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "--pdf", str(pdf), "--dry-run"])

    captured = capsys.readouterr()
    assert "Bloques detectados: 0" in captured.out
    assert "$0.0000 USD" in captured.out


# ---------------------------------------------------------------------------
# Missing env vars (non-dry-run)
# ---------------------------------------------------------------------------


def test_exits_1_when_db_url_missing(tmp_path, monkeypatch, capsys) -> None:
    """Script must exit 1 with a clear message when DB_URL is not set."""
    pdf = tmp_path / "test.pdf"
    pdf.write_bytes(b"%PDF-1.4 fake")

    monkeypatch.delenv("DB_URL", raising=False)
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)

    with pytest.raises(SystemExit) as exc_info:
        main(argv=["--model-id", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "--pdf", str(pdf)])

    assert exc_info.value.code == 1
    captured = capsys.readouterr()
    assert "DB_URL" in captured.err


def test_exits_1_when_anthropic_key_missing(tmp_path, monkeypatch, capsys) -> None:
    """Script must exit 1 with a clear message when ANTHROPIC_API_KEY is not set."""
    pdf = tmp_path / "test.pdf"
    pdf.write_bytes(b"%PDF-1.4 fake")

    monkeypatch.setenv("DB_URL", "postgresql://fake:5432/db")
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)

    with pytest.raises(SystemExit) as exc_info:
        main(argv=["--model-id", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "--pdf", str(pdf)])

    assert exc_info.value.code == 1
    captured = capsys.readouterr()
    assert "ANTHROPIC_API_KEY" in captured.err


# ---------------------------------------------------------------------------
# PDF validation
# ---------------------------------------------------------------------------


def test_exits_1_when_pdf_not_found(monkeypatch, capsys) -> None:
    """Script must exit 1 with a clear message when the PDF path does not exist."""
    monkeypatch.setenv("DB_URL", "postgresql://fake:5432/db")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "sk-ant-test")

    with pytest.raises(SystemExit) as exc_info:
        main(
            argv=[
                "--model-id",
                "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                "--pdf",
                "/nonexistent/path/modelo.pdf",
            ]
        )

    assert exc_info.value.code == 1
    captured = capsys.readouterr()
    assert "PDF no encontrado" in captured.err
