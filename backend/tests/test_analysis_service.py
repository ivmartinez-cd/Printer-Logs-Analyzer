"""Tests for AnalysisService — grouping, severity calculation and metadata."""

from datetime import datetime

from backend.application.services.analysis_service import AnalysisService
from backend.domain.entities import EnrichedEvent


def make_event(code: str, type_: str, ts: str, counter: int = 100) -> EnrichedEvent:
    return EnrichedEvent(
        type=type_,
        code=code,
        timestamp=datetime.fromisoformat(ts),
        counter=counter,
        firmware=None,
        help_reference=None,
        code_severity=None,
        code_description=None,
        code_solution_url=None,
        code_solution_content=None,
    )


service = AnalysisService()


# ---------------------------------------------------------------------------
# Test 1: lista vacía retorna resultado vacío con severidad INFO
# ---------------------------------------------------------------------------


def test_empty_events_returns_empty_result():
    result = service.analyze([])
    assert result.incidents == []
    assert result.global_severity == "INFO"
    assert result.metadata["events_considered"] == 0


# ---------------------------------------------------------------------------
# Test 2: severidad global es la máxima de todos los eventos
# ---------------------------------------------------------------------------


def test_global_severity_is_max_of_all_events():
    events = [
        make_event("A", "INFO", "2024-03-14T10:00:00"),
        make_event("B", "WARNING", "2024-03-14T11:00:00"),
        make_event("C", "ERROR", "2024-03-14T12:00:00"),
    ]
    result = service.analyze(events)
    assert result.global_severity == "ERROR"


# ---------------------------------------------------------------------------
# Test 3: eventos agrupados por código — un incidente por código
# ---------------------------------------------------------------------------


def test_events_grouped_by_code():
    events = [
        make_event("53.B0.02", "ERROR", "2024-03-14T10:00:00"),
        make_event("53.B0.02", "ERROR", "2024-03-14T10:05:00"),
        make_event("60.00.01", "WARNING", "2024-03-14T10:10:00"),
    ]
    result = service.analyze(events)
    assert len(result.incidents) == 2
    codes = {i.code for i in result.incidents}
    assert codes == {"53.B0.02", "60.00.01"}


# ---------------------------------------------------------------------------
# Test 4: occurrences cuenta eventos por grupo
# ---------------------------------------------------------------------------


def test_occurrences_count_per_group():
    events = [make_event("53.B0.02", "ERROR", f"2024-03-14T10:0{i}:00") for i in range(5)]
    result = service.analyze(events)
    assert len(result.incidents) == 1
    assert result.incidents[0].occurrences == 5


# ---------------------------------------------------------------------------
# Test 5: severidad por incidente es el máximo del grupo
# ---------------------------------------------------------------------------


def test_incident_severity_is_max_of_group():
    events = [
        make_event("53.B0.02", "INFO", "2024-03-14T10:00:00"),
        make_event("53.B0.02", "ERROR", "2024-03-14T10:05:00"),
        make_event("53.B0.02", "WARNING", "2024-03-14T10:10:00"),
    ]
    result = service.analyze(events)
    assert result.incidents[0].severity == "ERROR"
    assert result.incidents[0].severity_weight == 3


# ---------------------------------------------------------------------------
# Test 6: start_time y end_time correctos
# ---------------------------------------------------------------------------


def test_incident_start_end_time():
    events = [
        make_event("A", "ERROR", "2024-03-14T09:00:00"),
        make_event("A", "ERROR", "2024-03-14T12:00:00"),
        make_event("A", "ERROR", "2024-03-14T10:00:00"),
    ]
    result = service.analyze(events)
    inc = result.incidents[0]
    assert inc.start_time == datetime(2024, 3, 14, 9, 0, 0)
    assert inc.end_time == datetime(2024, 3, 14, 12, 0, 0)


# ---------------------------------------------------------------------------
# Test 7: classification usa code_description cuando está disponible
# ---------------------------------------------------------------------------


def test_classification_uses_description_when_available():
    evt = EnrichedEvent(
        type="ERROR",
        code="53.B0.02",
        timestamp=datetime(2024, 3, 14, 10, 0, 0),
        counter=100,
        firmware=None,
        help_reference=None,
        code_severity=None,
        code_description="Fuser error",
        code_solution_url=None,
        code_solution_content=None,
    )
    result = service.analyze([evt])
    assert result.incidents[0].classification == "Fuser error"


# ---------------------------------------------------------------------------
# Test 8: sds_link toma el primer code_solution_url del grupo
# ---------------------------------------------------------------------------


def test_sds_link_taken_from_first_event_with_url():
    events = [
        EnrichedEvent(
            type="ERROR",
            code="A",
            timestamp=datetime(2024, 3, 14, 10, 0, 0),
            counter=1,
            firmware=None,
            help_reference=None,
            code_severity=None,
            code_description=None,
            code_solution_url=None,
            code_solution_content=None,
        ),
        EnrichedEvent(
            type="ERROR",
            code="A",
            timestamp=datetime(2024, 3, 14, 10, 5, 0),
            counter=2,
            firmware=None,
            help_reference=None,
            code_severity=None,
            code_description=None,
            code_solution_url="https://example.com/sol",
            code_solution_content="Solución detallada",
        ),
    ]
    result = service.analyze(events)
    inc = result.incidents[0]
    assert inc.sds_link == "https://example.com/sol"
    assert inc.sds_solution_content == "Solución detallada"
