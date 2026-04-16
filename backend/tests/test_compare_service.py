"""Tests for calculate_trend — the core comparison logic."""

from backend.application.services.compare_service import calculate_trend

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


class FakeIncident:
    def __init__(self, code: str, severity: str, occurrences: int):
        self.code = code
        self.severity = severity
        self.occurrences = occurrences


def saved_inc(code: str, severity: str, occurrences: int) -> dict:
    return {"code": code, "severity": severity, "occurrences": occurrences}


def diff(nuevos=None, desaparecidos=None, cambios=None):
    return {
        "codigos_nuevos": nuevos or [],
        "codigos_desaparecidos": desaparecidos or [],
        "cambios_ocurrencias": cambios or [],
    }


# ---------------------------------------------------------------------------
# Test 1: nuevo código ERROR → empeoro
# ---------------------------------------------------------------------------


def test_new_error_code_returns_empeoro():
    saved = []
    current = [FakeIncident("53.B0.02", "ERROR", 5)]
    d = diff(nuevos=["53.B0.02"])
    assert calculate_trend(saved, current, d) == "empeoro"


# ---------------------------------------------------------------------------
# Test 2: nuevo código WARNING → no empeoro por ese motivo
# ---------------------------------------------------------------------------


def test_new_warning_code_is_not_empeoro():
    saved = []
    current = [FakeIncident("60.00.01", "WARNING", 3)]
    d = diff(nuevos=["60.00.01"])
    assert calculate_trend(saved, current, d) != "empeoro"


# ---------------------------------------------------------------------------
# Test 3: ERROR existente sube ≥ 3 ocurrencias → empeoro
# ---------------------------------------------------------------------------


def test_error_delta_gte3_returns_empeoro():
    saved = [saved_inc("53.B0.02", "ERROR", 2)]
    current = [FakeIncident("53.B0.02", "ERROR", 5)]
    d = diff(cambios=[{"code": "53.B0.02", "delta": 3}])
    assert calculate_trend(saved, current, d) == "empeoro"


# ---------------------------------------------------------------------------
# Test 4: ERROR existente sube < 3 → no empeoro por ese motivo
# ---------------------------------------------------------------------------


def test_error_delta_lt3_is_not_empeoro_by_delta():
    # saved=100, current=101: delta=1 (<3) and increase=1% (<20%) → estable
    saved = [saved_inc("53.B0.02", "ERROR", 100)]
    current = [FakeIncident("53.B0.02", "ERROR", 101)]
    d = diff(cambios=[{"code": "53.B0.02", "delta": 1}])
    assert calculate_trend(saved, current, d) == "estable"


# ---------------------------------------------------------------------------
# Test 5: snapshot tenía 0 errores y ahora hay 1+ → empeoro
# ---------------------------------------------------------------------------


def test_zero_to_one_errors_returns_empeoro():
    saved = [saved_inc("60.00.01", "WARNING", 3)]
    current = [FakeIncident("60.00.01", "WARNING", 3), FakeIncident("53.B0.02", "ERROR", 1)]
    d = diff(nuevos=["53.B0.02"])
    assert calculate_trend(saved, current, d) == "empeoro"


# ---------------------------------------------------------------------------
# Test 6: total ERRORs sube ≥ 20% → empeoro
# ---------------------------------------------------------------------------


def test_total_errors_increase_20pct_returns_empeoro():
    saved = [saved_inc("53.B0.02", "ERROR", 10)]
    current = [FakeIncident("53.B0.02", "ERROR", 12)]
    d = diff(cambios=[{"code": "53.B0.02", "delta": 2}])
    assert calculate_trend(saved, current, d) == "empeoro"


# ---------------------------------------------------------------------------
# Test 7: ERROR desaparece y total baja → mejoro
# ---------------------------------------------------------------------------


def test_error_disappears_returns_mejoro():
    saved = [saved_inc("53.B0.02", "ERROR", 5), saved_inc("60.00.01", "WARNING", 3)]
    current = [FakeIncident("60.00.01", "WARNING", 3)]
    d = diff(desaparecidos=["53.B0.02"])
    assert calculate_trend(saved, current, d) == "mejoro"


# ---------------------------------------------------------------------------
# Test 8: sin cambios relevantes → estable
# ---------------------------------------------------------------------------


def test_no_changes_returns_estable():
    saved = [saved_inc("53.B0.02", "ERROR", 5)]
    current = [FakeIncident("53.B0.02", "ERROR", 5)]
    d = diff()
    assert calculate_trend(saved, current, d) == "estable"


# ---------------------------------------------------------------------------
# Test 9: listas vacías no crashean
# ---------------------------------------------------------------------------


def test_empty_inputs_return_estable():
    assert calculate_trend([], [], diff()) == "estable"


# ---------------------------------------------------------------------------
# Test 10: mejoro requiere que no haya nuevos ERRORs
# ---------------------------------------------------------------------------


def test_mejoro_requires_no_new_errors():
    """A desaparecido + nuevo ERROR simultáneamente = empeoro, not mejoro."""
    saved = [saved_inc("53.B0.02", "ERROR", 5)]
    current = [FakeIncident("99.00.01", "ERROR", 2)]
    d = diff(nuevos=["99.00.01"], desaparecidos=["53.B0.02"])
    assert calculate_trend(saved, current, d) == "empeoro"
