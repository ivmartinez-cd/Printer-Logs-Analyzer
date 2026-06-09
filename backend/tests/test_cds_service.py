from unittest.mock import MagicMock, patch

import pytest
from backend.application.services.cds_service import (
    call_soap_method,
    get_cds_incidents_for_serial,
    parse_soap_response,
)
from backend.infrastructure.config import Settings


@pytest.fixture
def mock_settings():
    return Settings(
        DB_URL="postgresql://test",
        sds_web_username="test",
        sds_web_password="test",
        insight_portal_url="https://example.com",
        insight_api_key="key",
        insight_api_secret="secret"
    )

@pytest.mark.anyio
async def test_get_cds_incidents_mock_serial(mock_settings):
    # Tests the mock/test serial number BRBSN9YYK7
    incidents = await get_cds_incidents_for_serial(mock_settings, "BRBSN9YYK7")
    assert len(incidents) == 2
    assert incidents[0]["numero_incidente"] == "826546"
    assert incidents[0]["contador"] == "85240"
    assert len(incidents[0]["repuestos"]) == 1
    assert incidents[0]["repuestos"][0]["articulo"] == "Pickup Roller Tray 2"

    assert incidents[1]["numero_incidente"] == "822753"
    assert incidents[1]["contador"] == "81050"
    assert len(incidents[1]["repuestos"]) == 0

@pytest.mark.anyio
@patch("backend.application.services.cds_service.call_soap_method")
async def test_get_cds_incidents_live_flow(mock_soap, mock_settings):
    # Mock machine response
    machine_soap_res = """<?xml version="1.0" encoding="utf-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
  <SOAP-ENV:Body>
    <Respuesta xsi:type="xsd:string">{"Machine":{"id":"99999","NroSerie":"TESTSERIAL123","empresa_id":"111"}}</Respuesta>
  </SOAP-ENV:Body>
</SOAP-ENV:Envelope>"""

    # Mock incidents list response (last 6 months, date formatted DD/MM/YYYY HH:MM:SS)
    from datetime import datetime
    date_str = datetime.now().strftime("%d/%m/%Y %H:%M:%S")

    incidents_soap_res = f"""<?xml version="1.0" encoding="utf-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
  <SOAP-ENV:Body>
    <Result xsi:type="xsd:string">[
      {{"Incident": {{"id": "12345", "NroIncidente": "12345", "Fecha": "{date_str}", "Motivo": "Test Motivo", "Estado": "Cerrado"}}}}
    ]</Result>
  </SOAP-ENV:Body>
</SOAP-ENV:Envelope>"""

    # Mock counter response
    counter_soap_res = """<?xml version="1.0" encoding="utf-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
  <SOAP-ENV:Body>
    <Respuesta xsi:type="xsd:string">{"Contador":"50000","Error":""}</Respuesta>
  </SOAP-ENV:Body>
</SOAP-ENV:Envelope>"""

    # Mock replacements response
    replacements_soap_res = """<?xml version="1.0" encoding="utf-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
  <SOAP-ENV:Body>
    <Respuesta xsi:type="xsd:string">[
      {"Replacement": {"Articulo": "Test Part", "Cantidad": 2}}
    ]</Respuesta>
  </SOAP-ENV:Body>
</SOAP-ENV:Envelope>"""

    # Mock jobs response
    jobs_soap_res = """<?xml version="1.0" encoding="utf-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
  <SOAP-ENV:Body>
    <Respuesta xsi:type="xsd:string">[
      {"Job": {"Descripcion": "Se realiza reparacion de fusor", "Observ": "OK"}}
    ]</Respuesta>
  </SOAP-ENV:Body>
</SOAP-ENV:Envelope>"""

    mock_soap.side_effect = [
        machine_soap_res,
        incidents_soap_res,
        counter_soap_res,
        replacements_soap_res,
        jobs_soap_res
    ]

    incidents = await get_cds_incidents_for_serial(mock_settings, "TESTSERIAL123")
    assert len(incidents) == 1
    assert incidents[0]["numero_incidente"] == "12345"
    assert incidents[0]["contador"] == "50000"
    assert incidents[0]["motivo"] == "Test Motivo"
    assert len(incidents[0]["repuestos"]) == 1
    assert incidents[0]["repuestos"][0]["articulo"] == "Test Part"
    assert incidents[0]["repuestos"][0]["cantidad"] == 2
    assert len(incidents[0]["tareas_realizadas"]) == 1
    assert incidents[0]["tareas_realizadas"][0] == "Se realiza reparacion de fusor"
