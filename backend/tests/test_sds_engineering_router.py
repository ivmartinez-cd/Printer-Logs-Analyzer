"""Tests del router /sds/engineering/* (TestClient + dependency_overrides)."""

from __future__ import annotations

import os
import time
from datetime import datetime, timezone
from unittest.mock import MagicMock
from uuid import uuid4

os.environ.setdefault("DB_URL", "postgresql://test")
os.environ.setdefault("API_KEY", "dev")

import pytest
from backend.infrastructure.config import Settings
from backend.infrastructure.repositories.sds_engineering_repository import EngineeringCase
from backend.interface.api import get_app
from backend.interface.deps import (
    get_error_code_repo,
    get_notification_repo,
    get_sds_engineering_repo,
)
from fastapi.testclient import TestClient

_HEADERS = {"x-api-key": "dev"}


@pytest.fixture(autouse=True)
def no_rate_limit(monkeypatch: pytest.MonkeyPatch) -> None:
    from backend.interface.rate_limiter import limiter

    monkeypatch.setattr(limiter, "limit", lambda *args, **kwargs: lambda f: f)


def _settings(with_anthropic: bool = False, with_sds: bool = True) -> Settings:
    kwargs = {"DB_URL": "postgresql://test", "API_KEY": "dev"}
    if with_anthropic:
        kwargs["ANTHROPIC_API_KEY"] = "sk-ant-test"
    if with_sds:
        kwargs["SDS_WEB_USERNAME"] = "user"
        kwargs["SDS_WEB_PASSWORD"] = "pass"
    return Settings(**kwargs)


def _make_case(**overrides) -> EngineeringCase:
    defaults = {
        "id": uuid4(),
        "device_id": "100001",
        "incident_id": "900001",
        "serial": "MXBCT0000A",
        "code": "TriagePaperPath",
        "state": "New",
        "customer_name": "Cliente Demo SA",
        "severity": "Medium",
        "case_type": "ExpertRules",
        "created_at_portal": datetime(2026, 9, 1, tzinfo=timezone.utc),
        "updated_at_portal": datetime(2026, 9, 1, tzinfo=timezone.utc),
        "detail": None,
    }
    defaults.update(overrides)
    return EngineeringCase(**defaults)


def _client(settings: Settings, repo=None, error_code_repo=None, notification_repo=None) -> TestClient:
    app = get_app(settings=settings)
    if repo is not None:
        app.dependency_overrides[get_sds_engineering_repo] = lambda: repo
    if error_code_repo is not None:
        app.dependency_overrides[get_error_code_repo] = lambda: error_code_repo
    if notification_repo is not None:
        app.dependency_overrides[get_notification_repo] = lambda: notification_repo
    return TestClient(app)


class TestAuth:
    def test_endpoints_rechazan_api_key_incorrecta(self):
        client = _client(_settings())
        resp = client.get("/sds/engineering/cases", headers={"x-api-key": "wrong-key"})
        assert resp.status_code == 401


class TestListCases:
    def test_lista_casos_con_analisis_embebido(self):
        repo = MagicMock()
        case = _make_case()
        repo.list_cases.return_value = [case]
        analysis = MagicMock(veredicto="accionar", confianza="alta", created_at=None, model="claude-opus-5")
        repo.get_latest_analyses.return_value = {case.id: analysis}

        client = _client(_settings(), repo=repo)
        resp = client.get("/sds/engineering/cases", headers=_HEADERS)

        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1
        assert data["items"][0]["serial"] == "MXBCT0000A"
        assert data["items"][0]["analisis"]["veredicto"] == "accionar"

    def test_filtra_por_estado_via_query_param(self):
        repo = MagicMock()
        repo.list_cases.return_value = []
        repo.get_latest_analyses.return_value = {}

        client = _client(_settings(), repo=repo)
        resp = client.get("/sds/engineering/cases?state=Open&state=Postponed", headers=_HEADERS)

        assert resp.status_code == 200
        args, _kwargs = repo.list_cases.call_args
        assert args[0] == ["Open", "Postponed"]


class TestSync:
    def test_sync_sin_credenciales_sds_devuelve_503(self):
        client = _client(_settings(with_sds=False))
        resp = client.post("/sds/engineering/sync", json={}, headers=_HEADERS)
        assert resp.status_code == 503

    def test_sync_mapea_sdswerror_a_502(self, monkeypatch):
        from backend.application.services.sds_web_service import SDSWebError

        repo = MagicMock()

        def _raise(*_a, **_k):
            raise SDSWebError("portal caído")

        monkeypatch.setattr(
            "backend.application.services.sds_engineering_service.SdsEngineeringService.sync_cases",
            _raise,
        )

        client = _client(_settings(), repo=repo)
        resp = client.post("/sds/engineering/sync", json={}, headers=_HEADERS)
        assert resp.status_code == 502


class TestAnalyze:
    def test_sin_anthropic_key_devuelve_503(self):
        client = _client(_settings(with_anthropic=False))
        resp = client.post("/sds/engineering/analyze", json={"scope": "new"}, headers=_HEADERS)
        assert resp.status_code == 503

    def test_scope_invalido_devuelve_400(self):
        client = _client(_settings(with_anthropic=True))
        resp = client.post("/sds/engineering/analyze", json={"scope": "raro"}, headers=_HEADERS)
        assert resp.status_code == 400

    def test_selection_sin_incidents_devuelve_400(self):
        client = _client(_settings(with_anthropic=True))
        resp = client.post(
            "/sds/engineering/analyze", json={"scope": "selection"}, headers=_HEADERS
        )
        assert resp.status_code == 400

    def test_devuelve_job_id_y_polling_funciona(self):
        repo = MagicMock()
        repo.list_cases.return_value = []  # sin casos nuevos -> el job termina sin trabajo
        notification_repo = MagicMock()
        notification_repo.create.return_value = MagicMock(id=uuid4())

        client = _client(
            _settings(with_anthropic=True), repo=repo, notification_repo=notification_repo
        )
        resp = client.post("/sds/engineering/analyze", json={"scope": "new"}, headers=_HEADERS)

        assert resp.status_code == 200
        body = resp.json()
        assert "job_id" in body
        assert body["total"] == 0

        # El thread en background corre casi instantáneo con 0 grupos.
        for _ in range(20):
            job_resp = client.get(f"/sds/engineering/jobs/{body['job_id']}", headers=_HEADERS)
            if job_resp.json().get("status") == "completed":
                break
            time.sleep(0.05)
        assert job_resp.status_code == 200
        assert job_resp.json()["status"] == "completed"

    def test_job_inexistente_devuelve_404(self):
        client = _client(_settings())
        resp = client.get("/sds/engineering/jobs/no-existe", headers=_HEADERS)
        assert resp.status_code == 404
