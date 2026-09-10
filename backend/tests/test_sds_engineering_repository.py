"""Tests del repositorio de casos de ingeniería SDS: mapping local y fallback."""

from __future__ import annotations

import tempfile
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

import pytest

from backend.application.parsers.sds_engineering_parser import EngineeringCaseRow
from backend.infrastructure.database import DatabaseUnavailableError
from backend.infrastructure.repositories.sds_engineering_repository import (
    SdsEngineeringRepository,
)


@pytest.fixture
def local_paths(tmp_path):
    cases_path = tmp_path / "cases.json"
    analyses_path = tmp_path / "analyses.json"
    with (
        patch(
            "backend.infrastructure.repositories.sds_engineering_repository._LOCAL_CASES_PATH",
            cases_path,
        ),
        patch(
            "backend.infrastructure.repositories.sds_engineering_repository._LOCAL_ANALYSES_PATH",
            analyses_path,
        ),
    ):
        yield cases_path, analyses_path


@pytest.fixture
def repo():
    # __new__ evita que BaseRepository.__init__ instancie una Database real
    r = SdsEngineeringRepository.__new__(SdsEngineeringRepository)
    r._db = None
    r.resource_name = "SdsEngineering"
    return r


def _row(device_id="100001", incident_id="900001", **overrides) -> EngineeringCaseRow:
    defaults = {
        "device_id": device_id,
        "incident_id": incident_id,
        "serial": "MXBCT0000A",
        "customer_id": "9001",
        "customer_name": "Cliente Demo SA",
        "contract_id": "20001",
        "monitor_name": "demo1",
        "model": "HP LASERJET E50145",
        "firmware": "2508402_000098",
        "state": "New",
        "severity": "Medium",
        "case_type": "ExpertRules",
        "code": "TriagePaperPath",
        "probability": None,
        "lead_days": None,
        "median_days_to_failure": None,
        "created_at_portal": datetime(2026, 9, 8, tzinfo=timezone.utc),
        "updated_at_portal": datetime(2026, 9, 8, tzinfo=timezone.utc),
    }
    defaults.update(overrides)
    return EngineeringCaseRow(**defaults)


class TestUpsertCasesLocal:
    def test_inserta_caso_nuevo_y_lo_puede_recuperar(self, repo, local_paths):
        result = repo._upsert_cases_local([_row()])
        assert result["total"] == 1
        assert len(result["new"]) == 1
        assert result["updated"] == 0

        case = repo._get_case_local("100001", "900001")
        assert case is not None
        assert case.serial == "MXBCT0000A"
        assert case.code == "TriagePaperPath"
        assert case.customer_name == "Cliente Demo SA"

    def test_upsert_repetido_actualiza_en_vez_de_duplicar(self, repo, local_paths):
        repo._upsert_cases_local([_row(state="New")])
        result = repo._upsert_cases_local([_row(state="Open", severity="High")])

        assert result["total"] == 1
        assert result["updated"] == 1
        assert len(result["new"]) == 0

        case = repo._get_case_local("100001", "900001")
        assert case.state == "Open"
        assert case.severity == "High"

    def test_list_cases_local_filtra_por_estado_y_ordena_por_plazo(self, repo, local_paths):
        repo._upsert_cases_local(
            [
                _row(incident_id="1", state="New", lead_days=90),
                _row(incident_id="2", state="New", lead_days=5),
                _row(incident_id="3", state="Closed", lead_days=1),
                _row(incident_id="4", state="New", lead_days=None),
            ]
        )
        result = repo._list_cases_local(["New"], None, None, None, False, 200, 0)
        assert [c.incident_id for c in result] == ["2", "1", "4"]  # nulls al final

    def test_only_unanalyzed_excluye_casos_con_analisis(self, repo, local_paths):
        repo._upsert_cases_local([_row(incident_id="1"), _row(incident_id="2")])
        case1 = repo._get_case_local("100001", "1")
        repo._save_analysis_local(
            case_id=case1.id,
            group_key="100001",
            veredicto="monitorear",
            confianza="media",
            analysis={"x": 1},
            context_digest="abc",
            model="claude-opus-5",
            run_id=None,
            corroboracion_logs=None,
            motivo_cierre_sugerido=None,
            causa_raiz=None,
            source="ai",
            tokens=None,
            cost_usd=None,
        )
        result = repo._list_cases_local(None, None, None, None, True, 200, 0)
        assert [c.incident_id for c in result] == ["2"]


class TestSaveAnalysisLocal:
    def test_guarda_y_recupera_ultimo_analisis(self, repo, local_paths):
        repo._upsert_cases_local([_row()])
        case = repo._get_case_local("100001", "900001")

        repo._save_analysis_local(
            case_id=case.id,
            group_key="100001",
            veredicto="accionar",
            confianza="alta",
            analysis={"casos": []},
            context_digest="digest-1",
            model="claude-opus-5",
            run_id="run-1",
            corroboracion_logs="corrobora",
            motivo_cierre_sugerido=None,
            causa_raiz="Fuser gastado",
            source="ai",
            tokens={"input": 100, "output": 50},
            cost_usd=0.01,
        )

        latest = repo._get_latest_analyses_local([case.id])
        assert case.id in latest
        assert latest[case.id].veredicto == "accionar"
        assert latest[case.id].causa_raiz == "Fuser gastado"

    def test_historial_conserva_analisis_previos_mas_recientes_primero(self, repo, local_paths):
        repo._upsert_cases_local([_row()])
        case = repo._get_case_local("100001", "900001")

        for i, veredicto in enumerate(["monitorear", "accionar"]):
            repo._save_analysis_local(
                case_id=case.id,
                group_key="100001",
                veredicto=veredicto,
                confianza="media",
                analysis={"i": i},
                context_digest=f"digest-{i}",
                model="claude-opus-5",
                run_id=None,
                corroboracion_logs=None,
                motivo_cierre_sugerido=None,
                causa_raiz=None,
                source="ai",
                tokens=None,
                cost_usd=None,
            )

        history = repo._get_analysis_history_local(case.id)
        assert len(history) == 2
        assert history[0].veredicto == "accionar"  # el más reciente primero

    def test_has_analysis_with_digest_evita_reanalizar_sin_cambios(self, repo, local_paths):
        repo._upsert_cases_local([_row()])
        case = repo._get_case_local("100001", "900001")
        assert repo._has_analysis_with_digest_local(case.id, "digest-x") is False

        repo._save_analysis_local(
            case_id=case.id,
            group_key="100001",
            veredicto="monitorear",
            confianza="media",
            analysis={},
            context_digest="digest-x",
            model="claude-opus-5",
            run_id=None,
            corroboracion_logs=None,
            motivo_cierre_sugerido=None,
            causa_raiz=None,
            source="ai",
            tokens=None,
            cost_usd=None,
        )
        assert repo._has_analysis_with_digest_local(case.id, "digest-x") is True


class TestFallbackRespectsDisableLocalFallback:
    def test_disable_local_fallback_re_lanza_en_vez_de_escribir_json(self, repo, tmp_path):
        """En Render (DISABLE_LOCAL_FALLBACK=true) escribir a disco efímero se
        pierde sin avisar — el repo debe fallar explícito, no degradar en silencio."""

        def _raise_unavailable(*_a, **_k):
            raise DatabaseUnavailableError("no db")

        repo._upsert_cases_db = _raise_unavailable  # type: ignore[method-assign]

        settings = type("S", (), {"disable_local_fallback": True})()
        with patch(
            "backend.infrastructure.repositories.base_repository.get_settings",
            return_value=settings,
        ):
            with pytest.raises(DatabaseUnavailableError):
                repo.upsert_cases([_row()])

        # No debe haber escrito nada en disco.
        local_path = tmp_path / "cases.json"
        assert not local_path.exists()

    def test_local_fallback_habilitado_degrada_a_json(self, repo, local_paths):
        def _raise_unavailable(*_a, **_k):
            raise DatabaseUnavailableError("no db")

        repo._upsert_cases_db = _raise_unavailable  # type: ignore[method-assign]

        settings = type("S", (), {"disable_local_fallback": False})()
        with patch(
            "backend.infrastructure.repositories.base_repository.get_settings",
            return_value=settings,
        ):
            result = repo.upsert_cases([_row()])

        assert result["total"] == 1
        cases_path, _ = local_paths
        assert cases_path.exists()
