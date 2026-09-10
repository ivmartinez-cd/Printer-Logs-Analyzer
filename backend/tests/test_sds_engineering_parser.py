"""Tests puros (sin red) del parser de la cola de incidentes de ingeniería SDS."""

from __future__ import annotations

from datetime import timezone

from backend.application.parsers.sds_engineering_parser import (
    parse_action_event_detail,
    parse_advisories_list,
)
from backend.tests.fixtures.sds_engineering_html import (
    ADVISORIES_LIST_HTML,
    ADVISORIES_LIST_HTML_NO_THEAD,
    DETAIL_EXPERTRULES_HTML,
    DETAIL_PREDICTIVE_HTML,
)


class TestParseAdvisoriesList:
    def test_extrae_ids_y_columnas_basicas(self):
        rows = parse_advisories_list(ADVISORIES_LIST_HTML)
        assert len(rows) == 2

        r0 = rows[0]
        assert r0.device_id == "100001"
        assert r0.incident_id == "900001"
        assert r0.serial == "MXBCT0000A"
        assert r0.customer_id == "9001"
        assert r0.customer_name == "Cliente Demo SA"
        assert r0.contract_id == "20001"
        assert r0.monitor_name == "demo1"
        assert r0.model == "HP COLOR LASERJET MFP X57945"
        assert r0.firmware == "2508402_000098"
        assert r0.state == "New"
        assert r0.severity == "Medium"
        assert r0.case_type == "EngineAnalysis"
        assert r0.code == "TriageImageFormationAreaNoise"

    def test_checkbox_deviceid_incidentid_coherente_con_data_entity_id(self):
        rows = parse_advisories_list(ADVISORIES_LIST_HTML)
        # data-entity-id del <tr> y data-entity-id del <a> de Dispositivo deben
        # coincidir con el "device_id#incident_id" del checkbox de selección.
        assert rows[0].device_id == "100001" and rows[0].incident_id == "900001"
        assert rows[1].device_id == "100002" and rows[1].incident_id == "900002"

    def test_usa_data_sort_value_para_fechas_no_el_texto_es_ar(self):
        rows = parse_advisories_list(ADVISORIES_LIST_HTML)
        r0 = rows[0]
        assert r0.created_at_portal is not None
        assert r0.created_at_portal.tzinfo is not None
        assert r0.created_at_portal.astimezone(timezone.utc).year == 2026
        assert r0.created_at_portal.astimezone(timezone.utc).month == 9
        assert r0.created_at_portal.astimezone(timezone.utc).day == 8

    def test_probabilidad_vacia_devuelve_none_expertrules(self):
        rows = parse_advisories_list(ADVISORIES_LIST_HTML)
        assert rows[0].probability is None
        assert rows[0].lead_days is None
        assert rows[0].median_days_to_failure is None

    def test_probabilidad_presente_se_parsea_a_entero_predictive(self):
        rows = parse_advisories_list(ADVISORIES_LIST_HTML)
        r1 = rows[1]
        assert r1.probability == 65
        assert r1.lead_days == 90
        assert r1.median_days_to_failure == 8

    def test_tolera_html_sin_thead_usando_indice_posicional(self):
        rows = parse_advisories_list(ADVISORIES_LIST_HTML_NO_THEAD)
        assert len(rows) == 2
        assert rows[0].serial == "MXBCT0000A"
        assert rows[0].code == "TriageImageFormationAreaNoise"

    def test_html_vacio_o_sin_tabla_devuelve_lista_vacia(self):
        assert parse_advisories_list("<html><body>nada</body></html>") == []
        assert parse_advisories_list("") == []


class TestParseActionEventDetail:
    def test_parsea_por_etiqueta_no_por_posicion(self):
        detail = parse_action_event_detail(DETAIL_EXPERTRULES_HTML)
        assert detail.hp_action_id == "demo-action-uuid-0001"
        assert detail.case_type == "EngineAnalysis"
        assert detail.code == "TriageImageFormationAreaNoise"
        assert detail.severity == "Medium"
        assert "abnormal noises" in (detail.description or "")

    def test_extrae_estados_disponibles_del_select(self):
        detail = parse_action_event_detail(DETAIL_EXPERTRULES_HTML)
        assert detail.state == "Open"
        assert "ClosedIncorrectAction" in detail.available_states
        assert "ClosedFixedAsDesigned" in detail.available_states
        assert "ClosedCanceled" in detail.available_states

    def test_extrae_piezas_desde_lista(self):
        detail = parse_action_event_detail(DETAIL_EXPERTRULES_HTML)
        assert {"pn": "527H0MC", "description": "HP LaserJet Managed Image Transfer Belt"} in detail.parts
        assert {"pn": "RM2-3497-000CN", "description": "ASSY-MAIN DRIVE"} in detail.parts

    def test_extrae_more_info_url_y_texto(self):
        detail = parse_action_event_detail(DETAIL_EXPERTRULES_HTML)
        assert detail.more_info_url == "https://kaas.hpcloud.hp.com/doc?id=DEMO"
        assert detail.more_info_text == "Triage image formation area noise"

    def test_extrae_historial_de_estados(self):
        detail = parse_action_event_detail(DETAIL_EXPERTRULES_HTML)
        assert len(detail.state_history) == 1
        assert detail.state_history[0]["state"] == "Open"
        assert detail.state_history[0]["user"] == "[HP]"

    def test_extrae_csrf_y_hp_action_id_para_fase_2(self):
        detail = parse_action_event_detail(DETAIL_EXPERTRULES_HTML)
        assert detail.csrf_token == "demo-csrf-token"
        assert detail.edit_action_url == "/PortalWeb/devices/100001/hpsmart/actionevents/900001/edit"

    def test_campos_predictive_ausentes_en_expertrules_devuelven_none(self):
        detail = parse_action_event_detail(DETAIL_EXPERTRULES_HTML)
        assert detail.probability is None
        assert detail.lead_days is None
        assert detail.median_days_to_failure is None

    def test_campos_predictive_presentes_se_parsean(self):
        detail = parse_action_event_detail(DETAIL_PREDICTIVE_HTML)
        assert detail.probability == 65
        assert detail.lead_days == 90
        assert detail.median_days_to_failure == 8

    def test_predictive_sin_mas_informacion_no_rompe(self):
        detail = parse_action_event_detail(DETAIL_PREDICTIVE_HTML)
        assert detail.more_info_url is None
        assert detail.related_event_codes == []

    def test_historial_con_multiples_filas_y_comentario(self):
        detail = parse_action_event_detail(DETAIL_PREDICTIVE_HTML)
        assert len(detail.state_history) == 2
        assert detail.state_history[1]["state"] == "ClosedCanceled"
        assert detail.state_history[1]["comment"] == "Ya resuelto"

    def test_desenvuelve_cdata_wrapper(self):
        # Ambos fixtures ya vienen envueltos en <content><![CDATA[...]]></content>,
        # que es el wrapper real que devuelve el endpoint AJAX de EKM.
        detail = parse_action_event_detail(DETAIL_PREDICTIVE_HTML)
        assert detail.code == "TriageFuser"

    def test_html_vacio_devuelve_detail_con_campos_none(self):
        detail = parse_action_event_detail("<content><![CDATA[<html></html>]]></content>")
        assert detail.hp_action_id is None
        assert detail.parts == []
        assert detail.state_history == []
