import json
import time
from unittest.mock import MagicMock, patch

import pytest
import requests
from backend.application.services import cds_service
from backend.application.services.cds_service import (
    _is_cds_template,
    find_counter_for_incident,
    parse_soap_response,
)


@pytest.fixture(autouse=True)
def reset_circuit_breaker():
    cds_service._consecutive_failures = 0
    cds_service._circuit_breaker_until = 0.0
    cds_service._cds_cache.clear()
    yield
    cds_service._consecutive_failures = 0
    cds_service._circuit_breaker_until = 0.0
    cds_service._cds_cache.clear()


class TestParseSoapResponse:
    def test_parses_json_from_xml(self):
        xml = '<Respuesta xsi:type="xsd:string">{"key": "value"}</Respuesta>'
        result = parse_soap_response(xml, "Respuesta")
        assert result == {"key": "value"}

    def test_parses_html_entities(self):
        xml = '<Respuesta xsi:type="xsd:string">{&quot;key&quot;: &quot;value&quot;}</Respuesta>'
        result = parse_soap_response(xml, "Respuesta")
        assert result == {"key": "value"}

    def test_returns_none_on_missing_tag(self):
        result = parse_soap_response("<other>data</other>", "Respuesta")
        assert result is None

    def test_returns_none_on_invalid_json(self):
        xml = '<Respuesta xsi:type="xsd:string">not json</Respuesta>'
        result = parse_soap_response(xml, "Respuesta")
        assert result is None

    def test_parses_list_response(self):
        data = [{"Incident": {"id": "1"}}, {"Incident": {"id": "2"}}]
        xml = f'<Respuesta xsi:type="xsd:string">{json.dumps(data)}</Respuesta>'
        result = parse_soap_response(xml, "Respuesta")
        assert isinstance(result, list)
        assert len(result) == 2


class TestIsCdsTemplate:
    def test_detects_template_prefixes(self):
        assert _is_cds_template("Fallas: algún texto") is True
        assert _is_cds_template("Mensaje de error: algo") is True
        assert _is_cds_template("Observaciones: notas") is True

    def test_real_work_not_template(self):
        assert _is_cds_template("Se cambió el pickup roller") is False
        assert _is_cds_template("Limpieza general del equipo") is False


class TestFindCounterForIncident:
    def test_returns_none_on_empty_counters(self):
        assert find_counter_for_incident([], "01/01/2026 10:00:00", None) is None

    def test_returns_none_on_bad_date(self):
        assert find_counter_for_incident([], "not-a-date", None) is None

    def test_finds_informe_tecnico_in_range(self):
        counters = [
            {"Counter": {"FechaToma": "15/01/2026", "Contador": "50000", "TipoToma": "Informe S. Tecnico"}},
            {"Counter": {"FechaToma": "01/01/2026", "Contador": "49000", "TipoToma": "Lectura Normal"}},
        ]
        result = find_counter_for_incident(counters, "01/01/2026 08:00:00", "20/01/2026 08:00:00")
        assert result == "50000"

    def test_falls_back_to_latest_before_upper(self):
        counters = [
            {"Counter": {"FechaToma": "10/01/2026", "Contador": "48000", "TipoToma": "Lectura Normal"}},
        ]
        result = find_counter_for_incident(counters, "01/01/2026 08:00:00", "20/01/2026 08:00:00")
        assert result == "48000"


class TestCircuitBreaker:
    @patch("backend.application.services.cds_service.requests.post")
    def test_trips_after_threshold(self, mock_post):
        from backend.infrastructure.config import Settings
        mock_post.side_effect = requests.ConnectionError("connection refused")
        settings = MagicMock(spec=Settings)

        for _ in range(3):
            with pytest.raises(requests.RequestException):
                cds_service.call_soap_method(settings, "test", "<test/>")

        assert cds_service._circuit_breaker_until > time.time()

    def test_rejects_when_tripped(self):
        from backend.infrastructure.config import Settings
        cds_service._circuit_breaker_until = time.time() + 300
        settings = MagicMock(spec=Settings)

        with pytest.raises(Exception, match="Circuit breaker active"):
            cds_service.call_soap_method(settings, "test", "<test/>")


class TestCache:
    @pytest.mark.asyncio
    async def test_returns_cached_data(self):
        from backend.infrastructure.config import Settings
        settings = MagicMock(spec=Settings)
        serial = "TESTSERIAL1"
        cached = [{"id": "1", "motivo": "cached"}]
        cds_service._cds_cache[serial] = (time.time() + 600, cached)

        result = await cds_service.get_cds_incidents_for_serial(settings, serial)
        assert result == cached

    @pytest.mark.asyncio
    async def test_empty_serial_returns_empty(self):
        from backend.infrastructure.config import Settings
        settings = MagicMock(spec=Settings)
        result = await cds_service.get_cds_incidents_for_serial(settings, "  ")
        assert result == []
