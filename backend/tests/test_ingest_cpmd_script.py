"""Tests for backend.scripts.ingest_cpmd CLI script."""

from __future__ import annotations

from unittest.mock import patch, MagicMock

import pytest

from backend.scripts.ingest_cpmd import main
from backend.application.services.cpmd_parser import ErrorBlock
from backend.application.services.cpmd_structured_extractor import ExtractionResult
from backend.application.services.cpmd_extractor import ExtractedSolution


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
                raw_text=(
                    f"13.B{i}.00   Paper jam\n"
                    "The roller is worn.\n\n"
                    "Recommended action for service\n"
                    "1. Replace roller.\n"
                    "2. Run a test print.\n"
                ),
                source_audience="service",
                source_page=i + 1,
            )
        )
    for i in range(n_customers):
        blocks.append(
            ErrorBlock(
                code=f"50.0{i}.00",
                raw_title="Fuser error",
                raw_text=(
                    f"50.0{i}.00   Fuser error\n"
                    "The fuser failed to reach temperature.\n\n"
                    "Recommended action for customers\n"
                    "1. Call service.\n"
                ),
                source_audience="customers",
                source_page=n_service + i + 1,
            )
        )
    return blocks


def _make_result(block: ErrorBlock, score: float = 0.85) -> ExtractionResult:
    solution = ExtractedSolution(
        code=block.code,
        title=block.raw_title,
        cause="Test cause.",
        technician_steps=["Step one."],
        frus=[],
    )
    return ExtractionResult(
        block=block,
        solution=solution,
        confidence_score=score,
        has_fru_marker=False,
    )


# ---------------------------------------------------------------------------
# --dry-run
# ---------------------------------------------------------------------------


def test_dry_run_shows_block_counts(tmp_path: pytest.TempPathFactory, capsys) -> None:
    """--dry-run must print block counts and confidence distribution without touching DB or Haiku."""
    pdf = tmp_path / "test.pdf"
    pdf.write_bytes(b"%PDF-1.4 fake content")

    blocks = _make_blocks(n_service=2, n_customers=1)
    results = [_make_result(b) for b in blocks]
    mock_model = MagicMock(id="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", model_name="Test Model", model_code="T1")

    with (
        patch("backend.scripts.ingest_cpmd.load_dotenv"),
        patch("backend.infrastructure.database.Database"),
        patch("backend.infrastructure.repositories.printer_model_repository.PrinterModelRepository") as MockRepo,
        patch("backend.application.services.cpmd_parser.extract_error_blocks", return_value=blocks),
        patch("backend.application.services.cpmd_structured_extractor.extract_all", return_value=results),
        patch("backend.application.services.cpmd_structured_extractor.partition_by_confidence", return_value=(results, [])),
    ):
        MockRepo.return_value.get_by_id.return_value = mock_model
        main(argv=["--model-id", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "--pdf", str(pdf), "--dry-run"])

    captured = capsys.readouterr()
    assert "Bloques totales:" in captured.out
    assert "3" in captured.out
    assert "Alta confianza" in captured.out
    assert "Modelos objetivo:            1" in captured.out


def test_dry_run_zero_blocks(tmp_path: pytest.TempPathFactory, capsys) -> None:
    """--dry-run with an empty PDF (no blocks) must show 0."""
    pdf = tmp_path / "empty.pdf"
    pdf.write_bytes(b"%PDF-1.4 no blocks here")
    mock_model = MagicMock(id="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", model_name="Test Model", model_code="T1")

    with (
        patch("backend.scripts.ingest_cpmd.load_dotenv"),
        patch("backend.infrastructure.database.Database"),
        patch("backend.infrastructure.repositories.printer_model_repository.PrinterModelRepository") as MockRepo,
        patch("backend.application.services.cpmd_parser.extract_error_blocks", return_value=[]),
        patch("backend.application.services.cpmd_structured_extractor.extract_all", return_value=[]),
        patch("backend.application.services.cpmd_structured_extractor.partition_by_confidence", return_value=([], [])),
    ):
        MockRepo.return_value.get_by_id.return_value = mock_model
        main(argv=["--model-id", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "--pdf", str(pdf), "--dry-run"])

    captured = capsys.readouterr()
    assert "Modelos objetivo:            1" in captured.out
    assert "Bloques totales:             0" in captured.out


def test_dry_run_shows_low_confidence_list(tmp_path, capsys) -> None:
    """--dry-run must list low-confidence blocks separately."""
    pdf = tmp_path / "test.pdf"
    pdf.write_bytes(b"%PDF-1.4 fake")

    block_high = _make_blocks(n_service=1, n_customers=0)[0]
    block_low = ErrorBlock(
        code="99.FF.FF",
        raw_title="Unknown",
        raw_text="\n99.FF.FF   Unknown\nNo action section here.\n",
        source_audience="service",
        source_page=1,
    )
    result_high = _make_result(block_high, score=0.9)
    result_low = _make_result(block_low, score=0.2)
    mock_model = MagicMock(id="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", model_name="Test Model", model_code="T1")

    with (
        patch("backend.scripts.ingest_cpmd.load_dotenv"),
        patch("backend.infrastructure.database.Database"),
        patch("backend.infrastructure.repositories.printer_model_repository.PrinterModelRepository") as MockRepo,
        patch("backend.application.services.cpmd_parser.extract_error_blocks", return_value=[block_high, block_low]),
        patch("backend.application.services.cpmd_structured_extractor.extract_all", return_value=[result_high, result_low]),
        patch("backend.application.services.cpmd_structured_extractor.partition_by_confidence", return_value=([result_high], [result_low])),
    ):
        MockRepo.return_value.get_by_id.return_value = mock_model
        main(argv=["--model-id", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "--pdf", str(pdf), "--dry-run"])

    captured = capsys.readouterr()
    assert "99.FF.FF" in captured.out
    assert "Modelos objetivo:            1" in captured.out


# ---------------------------------------------------------------------------
# Missing env vars (non-dry-run)
# ---------------------------------------------------------------------------


def test_exits_1_when_db_url_missing(tmp_path, monkeypatch, capsys) -> None:
    """Script must exit 1 when DB_URL is not set."""
    pdf = tmp_path / "test.pdf"
    pdf.write_bytes(b"%PDF-1.4 fake")

    monkeypatch.delenv("DB_URL", raising=False)
    # mock load_dotenv so it doesn't load a real .env during test
    with patch("backend.scripts.ingest_cpmd.load_dotenv"):
        with pytest.raises(SystemExit) as exc_info:
            main(argv=["--model-id", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "--pdf", str(pdf)])

    assert exc_info.value.code == 1
    captured = capsys.readouterr()
    assert "DB_URL" in captured.err


def test_no_anthropic_key_prints_warning_not_error(tmp_path, monkeypatch, capsys) -> None:
    """Without ANTHROPIC_API_KEY the script should warn."""
    pdf = tmp_path / "test.pdf"
    pdf.write_bytes(b"%PDF-1.4 fake")

    monkeypatch.setenv("DB_URL", "postgresql://fake:5432/db")
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)

    with (
        patch("backend.scripts.ingest_cpmd.load_dotenv"),
        patch("backend.infrastructure.database.Database"),
        patch("backend.infrastructure.repositories.printer_model_repository.PrinterModelRepository") as MockRepo,
    ):
        MockRepo.return_value.get_by_id.return_value = None # Stop at model verify
        with pytest.raises(SystemExit):
            main(argv=["--model-id", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "--pdf", str(pdf)])

    captured = capsys.readouterr()
    assert "ANTHROPIC_API_KEY" in captured.out


# ---------------------------------------------------------------------------
# PDF and Argument validation
# ---------------------------------------------------------------------------


def test_exits_1_when_pdf_not_found(monkeypatch, capsys) -> None:
    """Script must exit 1 when the PDF path does not exist."""
    monkeypatch.setenv("DB_URL", "postgresql://fake:5432/db")
    with patch("backend.scripts.ingest_cpmd.load_dotenv"):
        with pytest.raises(SystemExit) as exc_info:
            main(argv=["--model-id", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "--pdf", "/nonexistent/path/modelo.pdf"])

    assert exc_info.value.code == 1
    captured = capsys.readouterr()
    assert "PDF no encontrado" in captured.err


def test_exits_1_when_model_id_invalid(tmp_path, capsys) -> None:
    """Script must exit 1 when model-id is not a valid UUID."""
    pdf = tmp_path / "test.pdf"
    pdf.write_bytes(b"%PDF-1.4 fake")

    with patch("backend.scripts.ingest_cpmd.load_dotenv"):
        with pytest.raises(SystemExit) as exc_info:
            main(argv=["--model-id", "not-a-uuid", "--pdf", str(pdf)])

    assert exc_info.value.code == 1
    captured = capsys.readouterr()
    assert "inválido" in captured.err


# ---------------------------------------------------------------------------
# --family
# ---------------------------------------------------------------------------


def test_dry_run_with_family(tmp_path: pytest.TempPathFactory, capsys) -> None:
    """--family must find all models in that family and show them in dry-run."""
    pdf = tmp_path / "test.pdf"
    pdf.write_bytes(b"%PDF-1.4 fake")

    blocks = _make_blocks(n_service=1, n_customers=0)
    results = [_make_result(b) for b in blocks]

    model1 = MagicMock(id="11111111-1111-1111-1111-111111111111", model_name="Model A", model_code="A")
    model2 = MagicMock(id="22222222-2222-2222-2222-222222222222", model_name="Model B", model_code="B")

    with (
        patch("backend.scripts.ingest_cpmd.load_dotenv"),
        patch("backend.infrastructure.database.Database"),
        patch("backend.infrastructure.repositories.printer_model_repository.PrinterModelRepository") as MockRepo,
        patch("backend.application.services.cpmd_parser.extract_error_blocks", return_value=blocks),
        patch("backend.application.services.cpmd_structured_extractor.extract_all", return_value=results),
        patch("backend.application.services.cpmd_structured_extractor.partition_by_confidence", return_value=(results, [])),
    ):
        mock_repo_inst = MockRepo.return_value
        mock_repo_inst.list_by_family.return_value = [model1, model2]

        main(argv=["--family", "E626xx", "--pdf", str(pdf), "--dry-run"])

    captured = capsys.readouterr()
    assert "Modelos objetivo:            2" in captured.out
    assert "Model A (A)" in captured.out
    assert "Model B (B)" in captured.out
    assert "Bloques totales:             1" in captured.out


def test_export_sql(tmp_path: pytest.TempPathFactory, capsys) -> None:
    """--output-sql must generate a file with INSERT statements."""
    pdf = tmp_path / "test.pdf"
    pdf.write_bytes(b"%PDF-1.4 fake")
    sql_out = tmp_path / "test.sql"

    blocks = _make_blocks(n_service=1, n_customers=0)
    # mock ErrorSolution so it has the fields needed by _export_to_sql
    mock_sol = MagicMock()
    mock_sol.model_id = "11111111-1111-1111-1111-111111111111"
    mock_sol.code = "13.B0.00"
    mock_sol.title = "Jam"
    mock_sol.cause = "Roller"
    mock_sol.technician_steps = ["Step 1"]
    mock_sol.frus = []
    mock_sol.source_audience = "service"
    mock_sol.source_page = 1
    mock_sol.cpmd_hash = "abc"

    report = MagicMock()
    report.solutions = [mock_sol]
    report.skipped = False
    report.total_blocks = 1
    report.regex_ok = 1
    report.llm_ok = 0
    report.failed = 0
    report.cpmd_hash = "abc"

    with (
        patch("backend.scripts.ingest_cpmd.load_dotenv"),
        patch("backend.infrastructure.database.Database"),
        patch("backend.infrastructure.repositories.printer_model_repository.PrinterModelRepository") as MockRepo,
        patch("backend.infrastructure.repositories.error_solution_repository.ErrorSolutionRepository"),
        patch("backend.application.services.cpmd_ingest.ingest_cpmd", return_value=report),
    ):
        mock_model = MagicMock(id="11111111-1111-1111-1111-111111111111", model_name="M", model_code="C")
        MockRepo.return_value.get_by_id.return_value = mock_model
        
        main(argv=["--model-id", "11111111-1111-1111-1111-111111111111", "--pdf", str(pdf), "--output-sql", str(sql_out)])

    assert sql_out.exists()
    content = sql_out.read_text(encoding="utf-8")
    assert "INSERT INTO error_solutions" in content
    assert "13.B0.00" in content
    assert "Jam" in content
