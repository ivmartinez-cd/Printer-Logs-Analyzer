"""Orquestación del módulo de casos de ingeniería SDS: ingesta, contexto y análisis IA.

Fase 1 (solo lectura): trae la cola de /sds/alerts/engineering, la persiste como
snapshot, y para cada equipo con casos abiertos arma un payload (caso + artículo
HP + event logs agregados + CDS opcional) y le pide a Claude un veredicto por
caso. Nada de esto escribe de vuelta en el portal de HP.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
from collections import Counter, defaultdict
from typing import Any, Optional
from uuid import uuid4

from backend.application.parsers.sds_engineering_parser import (
    EngineeringCaseRow,
    parse_action_event_detail,
    parse_advisories_list,
)
from backend.application.services.job_tracker import update_job
from backend.application.services.sds_engineering_ai import (
    MAX_CASES_PER_GROUP,
    MODEL,
    analyze_device_group,
    compute_cost,
)
from backend.application.services.sds_web_service import SDSWebError, get_session
from backend.infrastructure.config import Settings, get_settings
from backend.infrastructure.content_fetcher import fetch_solution_content
from backend.infrastructure.repositories.error_code_repository import ErrorCodeRepository
from backend.infrastructure.repositories.notification_repository import NotificationRepository
from backend.infrastructure.repositories.sds_engineering_repository import (
    EngineeringAnalysis,
    EngineeringCase,
    SdsEngineeringRepository,
)

_logger = logging.getLogger(__name__)

# Códigos resueltos por regla determinística, sin llamar a la IA (barato y exacto:
# comparar firmware actual contra el recomendado no necesita juicio).
_RULE_CODES = {"UpgradeFirmware"}


class SdsEngineeringService:
    def __init__(
        self,
        settings: Settings | None = None,
        repo: SdsEngineeringRepository | None = None,
        session: Any = None,
        error_code_repo: ErrorCodeRepository | None = None,
        notification_repo: NotificationRepository | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.repo = repo or SdsEngineeringRepository()
        self.sds_session = session or get_session(self.settings)
        self.error_code_repo = error_code_repo or ErrorCodeRepository()
        self.notification_repo = notification_repo

    # ------------------------------------------------------------------
    # Ingesta (sin IA)
    # ------------------------------------------------------------------

    def sync_cases(
        self,
        states: list[str] | None = None,
        severities: list[str] | None = None,
        types: list[str] | None = None,
        date_from: str | None = None,
        date_until: str | None = None,
        customer_id: str | None = None,
        maxrows: int = 200,
    ) -> dict:
        html = self.sds_session.fetch_engineering_advisories_html(
            states=states,
            severities=severities,
            types=types,
            date_from=date_from,
            date_until=date_until,
            customer_id=customer_id,
            maxrows=maxrows,
        )
        rows: list[EngineeringCaseRow] = parse_advisories_list(html)
        if not rows:
            _logger.warning(
                "sync_cases: 0 filas parseadas (HTTP 200) — posible cambio de estructura "
                "en el portal HP SDS o cola realmente vacía."
            )
        result = self.repo.upsert_cases(rows)
        return {"fetched": len(rows), "new": len(result["new"]), "updated": result["updated"]}

    def fetch_detail(self, case: EngineeringCase, force: bool = False) -> dict:
        if case.detail and not force:
            return case.detail
        raw = self.sds_session.fetch_action_event_detail_html(case.device_id, case.incident_id)
        detail = parse_action_event_detail(raw)
        detail_dict = detail.to_dict()
        self.repo.save_detail(case.id, detail_dict, detail.hp_action_id)
        case.detail = detail_dict
        return detail_dict

    # ------------------------------------------------------------------
    # Contexto
    # ------------------------------------------------------------------

    async def get_article_for_code(self, code: str, more_info_url: str | None) -> Optional[str]:
        """Artículo HP cacheado por código (tabla error_codes, compartida con el resto
        de la app). El link de triage es un token que expira — solo se re-baja si
        falta o quedó vacío en caché."""
        catalog = self.error_code_repo.get_by_codes([code])
        existing = catalog.get(code)
        if existing and existing.solution_content and existing.solution_content.strip():
            return existing.solution_content
        if not more_info_url:
            return None
        content = await fetch_solution_content(more_info_url, sds_session=self.sds_session)
        if content:
            try:
                self.error_code_repo.upsert(code=code, solution_content=content)
            except Exception as e:
                _logger.warning("No se pudo cachear el artículo de %s: %s", code, e)
        return content

    def _summarize_event_logs(self, device_id: str, days: int) -> dict:
        """Agrega el TSV de event logs por código — NUNCA se manda crudo a la IA."""
        from backend.application.parsers.log_parser import LogParser
        from backend.application.services.analysis_service import AnalysisService
        from backend.application.services.sds_web_service import html_to_tsv
        from backend.domain.entities import EnrichedEvent

        try:
            raw = self.sds_session.fetch_event_logs_html(device_id, days=days)
        except SDSWebError as e:
            _logger.warning("No se pudieron traer los event logs de %s: %s", device_id, e)
            return {"dias": days, "total_eventos": 0, "por_codigo": [], "ultimos_eventos": []}

        tsv = html_to_tsv(raw)
        if not tsv:
            return {"dias": days, "total_eventos": 0, "por_codigo": [], "ultimos_eventos": []}

        report = LogParser().parse_text(tsv)
        events = report.events
        if not events:
            return {"dias": days, "total_eventos": 0, "por_codigo": [], "ultimos_eventos": []}

        enriched = [EnrichedEvent(**e.model_dump()) for e in events]
        result = AnalysisService().analyze(enriched)

        por_codigo = [
            {
                "codigo": inc.code,
                "descripcion": inc.classification,
                "ocurrencias": inc.occurrences,
                "primera": inc.start_time.isoformat(),
                "ultima": inc.end_time.isoformat(),
            }
            for inc in result.incidents
        ]
        ultimos = sorted(events, key=lambda e: e.timestamp)[-10:]
        ultimos_eventos = [
            {"codigo": e.code, "tipo": e.type, "fecha": e.timestamp.isoformat()} for e in ultimos
        ]
        return {
            "dias": days,
            "total_eventos": len(events),
            "por_codigo": por_codigo,
            "ultimos_eventos": ultimos_eventos,
        }

    async def build_group_payload(
        self,
        cases: list[EngineeringCase],
        detail_by_id: dict,
        *,
        include_logs: bool = True,
        include_cds: bool = True,
    ) -> tuple[dict, str]:
        from backend.application.services.cds_service import get_cds_incidents_for_serial

        first = cases[0]
        device_id = first.device_id
        serial = first.serial

        codes = sorted({c.code for c in cases})
        articulos_hp: dict[str, str] = {}
        for code in codes:
            url = None
            for c in cases:
                if c.code == code:
                    url = (detail_by_id.get(c.id) or {}).get("more_info_url")
                    if url:
                        break
            article = await self.get_article_for_code(code, url)
            if article:
                articulos_hp[code] = article[:3000]

        if include_logs:
            evidencia_logs = await asyncio.to_thread(
                self._summarize_event_logs, device_id, self.settings.sds_eng_log_days
            )
        else:
            evidencia_logs = {"dias": 0, "total_eventos": 0, "por_codigo": [], "ultimos_eventos": []}

        historial_cds: list[dict] = []
        if include_cds:
            try:
                historial_cds = await asyncio.wait_for(
                    get_cds_incidents_for_serial(self.settings, serial), timeout=20
                )
            except Exception as e:
                _logger.warning("CDS no disponible para %s (se omite): %s", serial, e)
                historial_cds = []

        casos_payload = []
        for c in cases:
            d = detail_by_id.get(c.id) or {}
            casos_payload.append(
                {
                    "incident_id": c.incident_id,
                    "codigo": c.code,
                    "tipo": c.case_type,
                    "gravedad": c.severity,
                    "estado": c.state,
                    "creado": c.created_at_portal.isoformat() if c.created_at_portal else None,
                    "actualizado": c.updated_at_portal.isoformat() if c.updated_at_portal else None,
                    "descripcion": d.get("description"),
                    "probabilidad": c.probability,
                    "plazo_dias": c.lead_days,
                    "mediana_dias_hasta_falla": c.median_days_to_failure,
                    "piezas_sugeridas": d.get("parts", []),
                    "codigos_evento_relacionados": d.get("related_event_codes", []),
                    "estados_disponibles": d.get("available_states", []),
                    "historial_estados": d.get("state_history", []),
                }
            )

        payload = {
            "equipo": {
                "serial": serial,
                "modelo": first.model,
                "firmware": first.firmware,
                "cliente": first.customer_name,
            },
            "casos": casos_payload,
            "articulos_hp": articulos_hp,
            "evidencia_logs": evidencia_logs,
            "historial_cds": historial_cds,
        }
        digest = hashlib.sha256(
            json.dumps(payload, sort_keys=True, ensure_ascii=False, default=str).encode("utf-8")
        ).hexdigest()
        return payload, digest

    # ------------------------------------------------------------------
    # Análisis
    # ------------------------------------------------------------------

    @staticmethod
    def _deterministic_verdict(case: EngineeringCase) -> Optional[dict]:
        if case.code not in _RULE_CODES:
            return None
        return {
            "incident_id": case.incident_id,
            "codigo": case.code,
            "veredicto": "accionar",
            "confianza": "media",
            "corroboracion_logs": "sin_evidencia",
            "causa_raiz": "Firmware desactualizado según HP.",
            "justificacion": "Regla determinística: HP sugiere actualizar el firmware.",
            "pasos": ["Actualizar el firmware del equipo a la versión recomendada por HP."],
            "piezas": [],
            "motivo_cierre_sugerido": None,
            "comentario_cierre": None,
        }

    @staticmethod
    def _validate_group_result(
        result: dict, cases: list[EngineeringCase], detail_by_id: dict
    ) -> dict:
        """No confiar solo en el prompt: filtra piezas alucinadas, anula motivos de
        cierre no válidos para ESE caso, y fuerza monitorear si confianza es baja."""
        by_incident = {c.incident_id: c for c in cases}
        valid_casos = []
        seen: set[str] = set()

        for entry in result.get("casos", []) or []:
            inc_id = str(entry.get("incident_id", ""))
            case = by_incident.get(inc_id)
            if not case:
                continue
            seen.add(inc_id)

            detail = detail_by_id.get(case.id) or {}
            allowed_pns = {p.get("pn") for p in detail.get("parts", [])}
            entry["piezas"] = [p for p in entry.get("piezas") or [] if p.get("pn") in allowed_pns]

            allowed_states = set(detail.get("available_states", []))
            if entry.get("motivo_cierre_sugerido") and entry["motivo_cierre_sugerido"] not in allowed_states:
                entry["motivo_cierre_sugerido"] = None
                entry["comentario_cierre"] = None

            if entry.get("confianza") == "baja" and entry.get("veredicto") == "descartar":
                entry["veredicto"] = "monitorear"
                entry["motivo_cierre_sugerido"] = None
                entry["comentario_cierre"] = None

            valid_casos.append(entry)

        for inc_id, case in by_incident.items():
            if inc_id in seen:
                continue
            valid_casos.append(
                {
                    "incident_id": inc_id,
                    "codigo": case.code,
                    "veredicto": "monitorear",
                    "confianza": "baja",
                    "corroboracion_logs": "sin_evidencia",
                    "causa_raiz": None,
                    "justificacion": "El modelo no devolvió un veredicto para este caso.",
                    "pasos": [],
                    "piezas": [],
                    "motivo_cierre_sugerido": None,
                    "comentario_cierre": None,
                    "_error": "missing_in_ai_response",
                }
            )

        result["casos"] = valid_casos
        return result

    async def analyze_group(
        self,
        cases: list[EngineeringCase],
        api_key: str,
        run_id: str,
        include_logs: bool,
        include_cds: bool,
        force: bool,
    ) -> list[EngineeringAnalysis]:
        cases = cases[:MAX_CASES_PER_GROUP]
        rule_cases = [c for c in cases if c.code in _RULE_CODES]
        ai_cases = [c for c in cases if c.code not in _RULE_CODES]
        analyses: list[EngineeringAnalysis] = []

        for c in rule_cases:
            verdict = self._deterministic_verdict(c)
            digest = f"rule:{c.code}"
            if not force and self.repo.has_analysis_with_digest(c.id, digest):
                continue
            analyses.append(
                self.repo.save_analysis(
                    case_id=c.id,
                    group_key=c.device_id,
                    veredicto=verdict["veredicto"],
                    confianza=verdict["confianza"],
                    analysis=verdict,
                    context_digest=digest,
                    model="rule",
                    run_id=run_id,
                    corroboracion_logs=verdict["corroboracion_logs"],
                    motivo_cierre_sugerido=verdict["motivo_cierre_sugerido"],
                    causa_raiz=verdict["causa_raiz"],
                    source="rule",
                    tokens=None,
                    cost_usd=0.0,
                )
            )

        if not ai_cases:
            return analyses

        detail_by_id = {}
        for c in ai_cases:
            detail_by_id[c.id] = c.detail or await asyncio.to_thread(self.fetch_detail, c)
            c.detail = detail_by_id[c.id]

        payload, digest = await self.build_group_payload(
            ai_cases, detail_by_id, include_logs=include_logs, include_cds=include_cds
        )

        if not force and all(self.repo.has_analysis_with_digest(c.id, digest) for c in ai_cases):
            return analyses  # nada cambió desde el último análisis — no se re-paga

        result, tokens = await analyze_device_group(payload, api_key)
        if result is None:
            raise RuntimeError(
                f"La IA no devolvió un JSON válido para el equipo {ai_cases[0].device_id}"
            )
        result = self._validate_group_result(result, ai_cases, detail_by_id)
        cost = compute_cost(tokens)
        cost_per_case = cost / max(len(result["casos"]), 1)

        by_incident = {c.incident_id: c for c in ai_cases}
        for entry in result["casos"]:
            case = by_incident.get(str(entry.get("incident_id", "")))
            if not case:
                continue
            analyses.append(
                self.repo.save_analysis(
                    case_id=case.id,
                    group_key=case.device_id,
                    veredicto=entry["veredicto"],
                    confianza=entry["confianza"],
                    analysis={**entry, "consolidado": result.get("consolidado")},
                    context_digest=digest,
                    model=MODEL,
                    run_id=run_id,
                    corroboracion_logs=entry.get("corroboracion_logs"),
                    motivo_cierre_sugerido=entry.get("motivo_cierre_sugerido"),
                    causa_raiz=entry.get("causa_raiz"),
                    source="ai",
                    tokens=tokens,
                    cost_usd=cost_per_case,
                )
            )
        return analyses

    def _select_cases_for_scope(
        self, scope: str, pairs: list[tuple[str, str]] | None
    ) -> list[EngineeringCase]:
        if scope == "selection":
            return self.repo.list_cases_by_ids(pairs or [])
        if scope == "new":
            return self.repo.list_cases(
                states=["New", "Open", "Postponed"], only_unanalyzed=True, limit=500
            )
        if scope == "open":
            return self.repo.list_cases(states=["New", "Open", "Postponed"], limit=500)
        raise ValueError(f"scope inválido: {scope}")

    def analyze_cases(
        self,
        *,
        scope: str = "new",
        pairs: list[tuple[str, str]] | None = None,
        force: bool = False,
        include_logs: bool = True,
        include_cds: bool = True,
        job_id: str | None = None,
        notification_id=None,
    ) -> dict:
        """Entrypoint síncrono del job (se llama desde un threading.Thread)."""
        api_key = self.settings.anthropic_api_key
        if not api_key:
            raise RuntimeError("ANTHROPIC_API_KEY no configurada.")

        cases = self._select_cases_for_scope(scope, pairs)
        groups: dict[str, list[EngineeringCase]] = defaultdict(list)
        for c in cases:
            groups[c.device_id].append(c)
        group_list = list(groups.values())
        run_id = job_id or str(uuid4())

        counters = {"processed": 0, "errors": 0}
        all_analyses: list[EngineeringAnalysis] = []

        async def _run():
            sem = asyncio.Semaphore(max(1, self.settings.sds_eng_max_workers))

            async def _one(group: list[EngineeringCase]):
                async with sem:
                    try:
                        analyses = await self.analyze_group(
                            group, api_key, run_id, include_logs, include_cds, force
                        )
                        all_analyses.extend(analyses)
                    except Exception:
                        counters["errors"] += 1
                        _logger.exception(
                            "Fallo analizando el equipo device_id=%s", group[0].device_id
                        )
                    finally:
                        counters["processed"] += 1
                        if job_id:
                            update_job(job_id, counters["processed"], counters["errors"])

            await asyncio.gather(*[_one(g) for g in group_list])

        if group_list:
            asyncio.run(_run())

        veredictos = Counter(a.veredicto for a in all_analyses)
        summary = {
            "total_groups": len(group_list),
            "total_cases": len(cases),
            "analyzed": len(all_analyses),
            "errors": counters["errors"],
            "veredictos": dict(veredictos),
            "cost_usd": round(sum(a.cost_usd or 0 for a in all_analyses), 4),
        }
        if job_id:
            update_job(
                job_id, counters["processed"], counters["errors"], status="completed", results=summary
            )
        if notification_id and self.notification_repo:
            msg = (
                f"{summary['analyzed']} casos analizados: "
                f"{veredictos.get('accionar', 0)} accionar, "
                f"{veredictos.get('monitorear', 0)} monitorear, "
                f"{veredictos.get('descartar', 0)} descartar."
            )
            self.notification_repo.update_status(
                notification_id,
                status="success" if counters["errors"] == 0 else "warning",
                title="Análisis de casos de ingeniería completo",
                message=msg,
            )
        return summary

    def sync_and_analyze_new(self) -> dict:
        """Entrypoint del scheduler (APScheduler) — sincroniza y analiza los casos nuevos."""
        sync_result = self.sync_cases()
        notification_id = None
        if self.notification_repo:
            notif = self.notification_repo.create(
                type="sds_engineering_run",
                title="Análisis de casos de ingeniería SDS",
                message="Sincronizando y analizando casos nuevos...",
                status="in_progress",
            )
            notification_id = notif.id
        analysis_result = self.analyze_cases(scope="new", notification_id=notification_id)
        return {"sync": sync_result, "analysis": analysis_result}
