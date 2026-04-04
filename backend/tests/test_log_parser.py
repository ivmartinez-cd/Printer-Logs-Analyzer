"""Tests for LogParser — covers the critical parsing logic documented in CLAUDE.md."""

import pytest
from backend.application.parsers.log_parser import LogParser


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

VALID_LINE = "Error\t53.B0.02\t14-mar-2024 10:30:45\t12345\tv5.3.0\tSome help text"
VALID_LINE_NO_HELP = "Error\t53.B0.02\t14-mar-2024 10:30:45\t12345\tv5.3.0"


def parse(text: str):
    return LogParser().parse_text(text)


# ---------------------------------------------------------------------------
# Test 1: línea en blanco al inicio — header en la línea 2
# ---------------------------------------------------------------------------

def test_blank_line_before_header_is_tolerated():
    """Parser must ignore a header that appears after leading blank lines."""
    log = "\n\ntype\tcode\tfecha\thora\tcounter\tfirmware\n" + VALID_LINE
    report = parse(log)
    assert len(report.events) == 1
    assert len(report.errors) == 0


# ---------------------------------------------------------------------------
# Test 2: horas de 1 dígito (9:30:00 → 09:30:00)
# ---------------------------------------------------------------------------

def test_single_digit_hour_is_normalized():
    line = "Error\t53.B0.02\t14-mar-2024 9:05:00\t12345\tv5.3.0\t"
    report = parse(line)
    assert len(report.events) == 1
    assert report.events[0].timestamp.hour == 9


# ---------------------------------------------------------------------------
# Test 3: header en línea 1, 2 o 3 — todas deben ignorarse
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("prefix_blanks", [0, 1, 2])
def test_header_detected_in_first_3_nonempty_lines(prefix_blanks):
    blank = "\n" * prefix_blanks
    header = "type\tcode\tfecha\thora\tcounter\tfirmware\n"
    report = parse(blank + header + VALID_LINE)
    assert len(report.events) == 1


# ---------------------------------------------------------------------------
# Test 4: meses en español
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("month_es,month_num", [
    ("ene", 1), ("feb", 2), ("mar", 3), ("abr", 4),
    ("may", 5), ("jun", 6), ("jul", 7), ("ago", 8),
    ("sep", 9), ("oct", 10), ("nov", 11), ("dic", 12),
])
def test_spanish_months_are_parsed(month_es, month_num):
    line = f"Error\t53.B0.02\t14-{month_es}-2024 10:30:45\t12345\tv5.3.0\t"
    report = parse(line)
    assert len(report.errors) == 0, f"Failed for month {month_es}: {report.errors}"
    assert report.events[0].timestamp.month == month_num


# ---------------------------------------------------------------------------
# Test 5: líneas malformadas registran error sin detener el parse
# ---------------------------------------------------------------------------

def test_malformed_lines_do_not_stop_parsing():
    bad_line = "esto no es un log válido"
    log = bad_line + "\n" + VALID_LINE
    report = parse(log)
    assert len(report.events) == 1
    assert len(report.errors) == 1
    assert report.errors[0].line_number == 1


# ---------------------------------------------------------------------------
# Test 6: tipo de evento no reconocido genera error
# ---------------------------------------------------------------------------

def test_unknown_event_type_generates_parse_error():
    line = "Advertencia\t53.B0.02\t14-mar-2024 10:30:45\t12345\tv5.3.0\t"
    report = parse(line)
    assert len(report.events) == 0
    assert len(report.errors) == 1
    assert "Unsupported event type" in report.errors[0].reason


# ---------------------------------------------------------------------------
# Test 7: counter negativo o no numérico genera error
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("bad_counter", ["-1", "abc", "12.5", ""])
def test_invalid_counter_generates_parse_error(bad_counter):
    line = f"Error\t53.B0.02\t14-mar-2024 10:30:45\t{bad_counter}\tv5.3.0\t"
    report = parse(line)
    assert len(report.events) == 0
    assert len(report.errors) == 1


# ---------------------------------------------------------------------------
# Test 8: normalización de espacios múltiples (logs copiados del portal HP)
# ---------------------------------------------------------------------------

def test_multiple_spaces_normalized_to_tabs():
    """HP portal copies logs with multiple spaces instead of tabs."""
    # This normalization happens in api.py (_normalize_log_text),
    # so we simulate it here before calling the parser.
    import re
    raw = "Error  53.B0.02  14-mar-2024 10:30:45  12345  v5.3.0  Some help"
    normalized = re.sub(r" {2,}", "\t", raw)
    report = parse(normalized)
    assert len(report.events) == 1
    assert report.events[0].code == "53.B0.02"


# ---------------------------------------------------------------------------
# Test 9: campos opcionales (firmware y help_reference pueden ser None)
# ---------------------------------------------------------------------------

def test_optional_help_reference_can_be_empty():
    """help_reference (6th column) is optional — firmware must still be present."""
    line = "Info\t99.00.01\t01-ene-2024 08:00:00\t100\tv1.0\t"
    report = parse(line)
    assert len(report.events) == 1
    evt = report.events[0]
    assert evt.firmware == "v1.0"
    assert evt.help_reference is None


# ---------------------------------------------------------------------------
# Test 10: múltiples eventos, orden preservado por timestamp
# ---------------------------------------------------------------------------

def test_multiple_events_parsed_in_order():
    log = (
        "Error\t53.B0.02\t14-mar-2024 10:30:45\t12345\tv5.3.0\t\n"
        "Warning\t60.00.01\t14-mar-2024 11:00:00\t12400\tv5.3.0\t\n"
        "Info\t99.00.01\t14-mar-2024 09:00:00\t12000\tv5.3.0\t\n"
    )
    report = parse(log)
    assert len(report.events) == 3
    assert len(report.errors) == 0
