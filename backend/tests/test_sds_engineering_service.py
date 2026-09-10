"""Tests del servicio de orquestación de casos de ingeniería SDS (sin red real).

No usa pytest-asyncio (no está en requirements.txt, como el resto del repo) —
los métodos async se ejercitan con asyncio.run() dentro de un test sync, igual
que TestClient hace por debajo con los endpoints FastAPI.
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

from backend.application.services.sds_engineering_service import SdsEngineeringService
from backend.infrastructure.repositories.sds_engineering_repository import (
    EngineeringAnalysis,
    EngineeringCase,
)


def _make_case(**overrides) -> EngineeringCase:
    defaults = {
        "id": uuid4(),
        "device_id": "100001",
        "incident_id": "900001",
        "serial": "MXBCT0000A",
        "code": "TriageFuser",
        "state": "New",
        "customer_name": "Cliente Demo SA",
        "model": "HP LASERJET E50145",
        "firmware": "2508402_000098",
        "severity": "Medium",
        "case_type": "ExpertRules",
        "probability": None,
        "lead_days": 30,
        "median_days_to_failure": None,
        "created_at_portal": datetime(2026, 9, 1, tzinfo=timezone.utc),
        "updated_at_portal": datetime(2026, 9, 1, tzinfo=timezone.utc),
        "detail": {
            "description": "Fuser jam.",
            "more_info_url": "https://kaas.hpcloud.hp.com/doc?id=DEMO",
            "parts": [{"pn": "RM2-5692-000CN", "description": "Fuser Assembly"}],
            "related_event_codes": [],
            "available_states": [
                "Open",
                "Postponed",
                "ClosedIgnored",
                "ClosedFixedAsDesigned",
                "ClosedIncorrectAction",
                "ClosedCanceled",
            ],
            "state_history": [],
        },
    }
    defaults.update(overrides)
    return EngineeringCase(**defaults)


def _make_service():
    repo = MagicMock()
    session = MagicMock()
    error_code_repo = MagicMock()
    error_code_repo.get_by_codes.return_value = {}
    settings = MagicMock(sds_eng_log_days=60, sds_eng_max_workers=3, anthropic_api_key="test-key")
    return SdsEngineeringService(
        settings=settings, repo=repo, session=session, error_code_repo=error_code_repo
    )


class TestBuildGroupPayload:
    def test_dedupe_articulo_por_codigo(self):
        service = _make_service()
        c1 = _make_case(incident_id="1", code="TriageFuser")
        c2 = _make_case(incident_id="2", code="TriageFuser")  # mismo código, mismo equipo

        service.get_article_for_code = AsyncMock(return_value="Recommended action: replace fuser.")
        service._summarize_event_logs = MagicMock(
            return_value={"dias": 60, "total_eventos": 0, "por_codigo": [], "ultimos_eventos": []}
        )

        payload, _digest = asyncio.run(
            service.build_group_payload(
                [c1, c2], {c1.id: c1.detail, c2.id: c2.detail}, include_logs=True, include_cds=False
            )
        )

        assert service.get_article_for_code.await_count == 1  # un solo código distinto
        assert list(payload["articulos_hp"].keys()) == ["TriageFuser"]
        assert len(payload["casos"]) == 2

    def test_agrega_logs_no_manda_tsv_crudo(self):
        service = _make_service()
        c1 = _make_case()
        service.get_article_for_code = AsyncMock(return_value=None)
        service._summarize_event_logs = MagicMock(
            return_value={
                "dias": 60,
                "total_eventos": 500,
                "por_codigo": [
                    {"codigo": "13.B9.Az", "descripcion": "Jam", "ocurrencias": 6, "primera": "x", "ultima": "y"}
                ],
                "ultimos_eventos": [{"codigo": "13.B9.Az", "tipo": "ERROR", "fecha": "z"}],
            }
        )
        payload, _digest = asyncio.run(
            service.build_group_payload([c1], {c1.id: c1.detail}, include_logs=True, include_cds=False)
        )
        assert payload["evidencia_logs"]["total_eventos"] == 500
        assert "por_codigo" in payload["evidencia_logs"]
        assert len(str(payload["evidencia_logs"])) < 4000

    def test_omite_cds_si_include_cds_false(self):
        service = _make_service()
        c1 = _make_case()
        service.get_article_for_code = AsyncMock(return_value=None)
        service._summarize_event_logs = MagicMock(
            return_value={"dias": 60, "total_eventos": 0, "por_codigo": [], "ultimos_eventos": []}
        )
        payload, _digest = asyncio.run(
            service.build_group_payload([c1], {c1.id: c1.detail}, include_logs=True, include_cds=False)
        )
        assert payload["historial_cds"] == []

    def test_digest_estable_y_sensible_a_cambios(self):
        service = _make_service()
        c1 = _make_case()
        service.get_article_for_code = AsyncMock(return_value=None)
        service._summarize_event_logs = MagicMock(
            return_value={"dias": 60, "total_eventos": 0, "por_codigo": [], "ultimos_eventos": []}
        )
        _p1, digest1 = asyncio.run(
            service.build_group_payload([c1], {c1.id: c1.detail}, include_logs=True, include_cds=False)
        )
        _p2, digest2 = asyncio.run(
            service.build_group_payload([c1], {c1.id: c1.detail}, include_logs=True, include_cds=False)
        )
        assert digest1 == digest2

        c1_changed = _make_case(lead_days=5)
        _p3, digest3 = asyncio.run(
            service.build_group_payload(
                [c1_changed], {c1_changed.id: c1_changed.detail}, include_logs=True, include_cds=False
            )
        )
        assert digest3 != digest1


class TestValidateGroupResult:
    def test_filtra_piezas_alucinadas(self):
        service = _make_service()
        c1 = _make_case()
        result = {
            "casos": [
                {
                    "incident_id": "900001",
                    "veredicto": "accionar",
                    "confianza": "alta",
                    "piezas": [
                        {"pn": "RM2-5692-000CN", "descripcion": "Fuser Assembly", "prioridad": "llevar"},
                        {"pn": "PN-INVENTADO", "descripcion": "no existe", "prioridad": "llevar"},
                    ],
                }
            ]
        }
        validated = service._validate_group_result(result, [c1], {c1.id: c1.detail})
        pns = [p["pn"] for p in validated["casos"][0]["piezas"]]
        assert pns == ["RM2-5692-000CN"]

    def test_anula_motivo_cierre_no_disponible(self):
        service = _make_service()
        c1 = _make_case()
        result = {
            "casos": [
                {
                    "incident_id": "900001",
                    "veredicto": "descartar",
                    "confianza": "alta",
                    "motivo_cierre_sugerido": "ClosedNoExiste",
                    "comentario_cierre": "texto",
                }
            ]
        }
        validated = service._validate_group_result(result, [c1], {c1.id: c1.detail})
        assert validated["casos"][0]["motivo_cierre_sugerido"] is None
        assert validated["casos"][0]["comentario_cierre"] is None

    def test_confianza_baja_no_puede_descartar(self):
        service = _make_service()
        c1 = _make_case()
        result = {
            "casos": [
                {
                    "incident_id": "900001",
                    "veredicto": "descartar",
                    "confianza": "baja",
                    "motivo_cierre_sugerido": "ClosedIgnored",
                }
            ]
        }
        validated = service._validate_group_result(result, [c1], {c1.id: c1.detail})
        assert validated["casos"][0]["veredicto"] == "monitorear"
        assert validated["casos"][0]["motivo_cierre_sugerido"] is None

    def test_caso_faltante_en_respuesta_se_completa_con_error(self):
        service = _make_service()
        c1 = _make_case(incident_id="900001")
        c2 = _make_case(incident_id="900002")
        result = {"casos": [{"incident_id": "900001", "veredicto": "monitorear", "confianza": "media"}]}
        validated = service._validate_group_result(
            result, [c1, c2], {c1.id: c1.detail, c2.id: c2.detail}
        )
        ids = {c["incident_id"] for c in validated["casos"]}
        assert ids == {"900001", "900002"}
        missing = next(c for c in validated["casos"] if c["incident_id"] == "900002")
        assert missing["_error"] == "missing_in_ai_response"


class TestDeterministicVerdict:
    def test_upgrade_firmware_no_llama_ia(self):
        service = _make_service()
        c1 = _make_case(code="UpgradeFirmware")
        verdict = service._deterministic_verdict(c1)
        assert verdict is not None
        assert verdict["veredicto"] == "accionar"

    def test_otros_codigos_devuelven_none(self):
        service = _make_service()
        c1 = _make_case(code="TriageFuser")
        assert service._deterministic_verdict(c1) is None


class TestAnalyzeGroup:
    def test_mapea_casos_por_incident_id_y_persiste(self, monkeypatch):
        service = _make_service()
        c1 = _make_case(incident_id="900001", code="TriageFuser")
        service.repo.has_analysis_with_digest.return_value = False
        service.repo.save_analysis.side_effect = lambda **kw: EngineeringAnalysis(
            id=uuid4(),
            case_id=kw["case_id"],
            group_key=kw["group_key"],
            veredicto=kw["veredicto"],
            confianza=kw["confianza"],
            analysis=kw["analysis"],
            context_digest=kw["context_digest"],
            model=kw["model"],
        )

        service.build_group_payload = AsyncMock(return_value=({"casos": []}, "digest-1"))

        async def fake_analyze(payload, api_key):
            return (
                {
                    "casos": [
                        {
                            "incident_id": "900001",
                            "veredicto": "accionar",
                            "confianza": "alta",
                            "piezas": [],
                        }
                    ],
                    "consolidado": {"visita_requerida": "si"},
                },
                {"input": 100, "output": 50, "cache_write": 0, "cache_read": 0},
            )

        monkeypatch.setattr(
            "backend.application.services.sds_engineering_service.analyze_device_group", fake_analyze
        )

        analyses = asyncio.run(service.analyze_group([c1], "api-key", "run-1", True, True, False))
        assert len(analyses) == 1
        assert analyses[0].veredicto == "accionar"

    def test_saltea_caso_con_mismo_digest_salvo_force(self):
        service = _make_service()
        c1 = _make_case()
        service.build_group_payload = AsyncMock(return_value=({}, "same-digest"))
        service.repo.has_analysis_with_digest.return_value = True

        analyses = asyncio.run(
            service.analyze_group([c1], "api-key", "run-1", True, True, force=False)
        )
        assert analyses == []
        service.repo.save_analysis.assert_not_called()
