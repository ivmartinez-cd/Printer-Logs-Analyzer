"""Persistencia de la cola de incidentes de ingeniería SDS + sus análisis de IA.

Snapshot de cada caso (tabla sds_engineering_cases) + historial de veredictos
(sds_engineering_analyses). PostgreSQL con fallback a JSON local, respetando
`settings.disable_local_fallback` (Render free tier: escribir a disco efímero
ahí se pierde en el próximo redeploy sin avisar — se prefiere fallar explícito).
"""

from __future__ import annotations

import json
import threading
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional
from uuid import UUID, uuid4

from backend.application.parsers.sds_engineering_parser import EngineeringCaseRow
from backend.infrastructure.database import Database, DatabaseUnavailableError
from backend.infrastructure.repositories.base_repository import BaseRepository

_LOCAL_CASES_PATH = Path(__file__).parent.parent.parent.parent / "data" / "sds_engineering_cases_local.json"
_LOCAL_ANALYSES_PATH = (
    Path(__file__).parent.parent.parent.parent / "data" / "sds_engineering_analyses_local.json"
)
_local_write_lock = threading.Lock()


def _iso(dt: datetime | None) -> str | None:
    return dt.isoformat() if dt else None


def _from_iso(value: Any) -> Optional[datetime]:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    return datetime.fromisoformat(value)


@dataclass
class EngineeringCase:
    """Snapshot persistido de un caso de la cola de ingeniería."""

    id: UUID
    device_id: str
    incident_id: str
    serial: str
    code: str
    state: str
    hp_action_id: Optional[str] = None
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    contract_id: Optional[str] = None
    monitor_name: Optional[str] = None
    model: Optional[str] = None
    firmware: Optional[str] = None
    severity: Optional[str] = None
    case_type: Optional[str] = None
    probability: Optional[int] = None
    lead_days: Optional[int] = None
    median_days_to_failure: Optional[int] = None
    created_at_portal: Optional[datetime] = None
    updated_at_portal: Optional[datetime] = None
    detail: Optional[dict] = None
    detail_fetched_at: Optional[datetime] = None
    first_seen_at: Optional[datetime] = None
    last_seen_at: Optional[datetime] = None


@dataclass
class EngineeringAnalysis:
    """Un veredicto de IA (o de regla determinística) para un caso puntual."""

    id: UUID
    case_id: UUID
    group_key: str
    veredicto: str
    confianza: str
    analysis: dict
    context_digest: str
    model: str
    run_id: Optional[str] = None
    corroboracion_logs: Optional[str] = None
    motivo_cierre_sugerido: Optional[str] = None
    causa_raiz: Optional[str] = None
    source: str = "ai"
    tokens: Optional[dict] = None
    cost_usd: Optional[float] = None
    created_at: Optional[datetime] = None


class SdsEngineeringRepository(BaseRepository[EngineeringCase, UUID]):
    """Hereda de BaseRepository para respetar `disable_local_fallback`."""

    def __init__(self, database: Database | None = None) -> None:
        super().__init__(database)

    # ------------------------------------------------------------------
    # Casos
    # ------------------------------------------------------------------

    def upsert_cases(self, rows: list[EngineeringCaseRow]) -> dict:
        """Inserta o actualiza el snapshot de cada fila. -> {'new': [...], 'updated': n, 'total': n}"""
        return self._execute_with_fallback(self._upsert_cases_db, self._upsert_cases_local, rows)

    def save_detail(self, case_id: UUID, detail: dict, hp_action_id: str | None) -> None:
        self._execute_with_fallback(
            self._save_detail_db, self._save_detail_local, case_id, detail, hp_action_id
        )

    def get_case(self, device_id: str, incident_id: str) -> Optional[EngineeringCase]:
        return self._execute_with_fallback(
            self._get_case_db, self._get_case_local, device_id, incident_id
        )

    def get_case_by_id(self, case_id: UUID) -> Optional[EngineeringCase]:
        return self._execute_with_fallback(self._get_case_by_id_db, self._get_case_by_id_local, case_id)

    def list_cases(
        self,
        states: list[str] | None = None,
        severities: list[str] | None = None,
        codes: list[str] | None = None,
        serial: str | None = None,
        only_unanalyzed: bool = False,
        limit: int = 200,
        offset: int = 0,
    ) -> list[EngineeringCase]:
        return self._execute_with_fallback(
            self._list_cases_db,
            self._list_cases_local,
            states,
            severities,
            codes,
            serial,
            only_unanalyzed,
            limit,
            offset,
        )

    def list_cases_by_ids(self, pairs: list[tuple[str, str]]) -> list[EngineeringCase]:
        return self._execute_with_fallback(
            self._list_cases_by_ids_db, self._list_cases_by_ids_local, pairs
        )

    # ------------------------------------------------------------------
    # Análisis
    # ------------------------------------------------------------------

    def save_analysis(
        self,
        case_id: UUID,
        group_key: str,
        veredicto: str,
        confianza: str,
        analysis: dict,
        context_digest: str,
        model: str,
        run_id: str | None = None,
        corroboracion_logs: str | None = None,
        motivo_cierre_sugerido: str | None = None,
        causa_raiz: str | None = None,
        source: str = "ai",
        tokens: dict | None = None,
        cost_usd: float | None = None,
    ) -> EngineeringAnalysis:
        return self._execute_with_fallback(
            self._save_analysis_db,
            self._save_analysis_local,
            case_id,
            group_key,
            veredicto,
            confianza,
            analysis,
            context_digest,
            model,
            run_id,
            corroboracion_logs,
            motivo_cierre_sugerido,
            causa_raiz,
            source,
            tokens,
            cost_usd,
        )

    def get_latest_analyses(self, case_ids: list[UUID]) -> dict[UUID, EngineeringAnalysis]:
        if not case_ids:
            return {}
        return self._execute_with_fallback(
            self._get_latest_analyses_db, self._get_latest_analyses_local, case_ids
        )

    def get_analysis_history(self, case_id: UUID) -> list[EngineeringAnalysis]:
        return self._execute_with_fallback(
            self._get_analysis_history_db, self._get_analysis_history_local, case_id
        )

    def has_analysis_with_digest(self, case_id: UUID, digest: str) -> bool:
        return self._execute_with_fallback(
            self._has_analysis_with_digest_db, self._has_analysis_with_digest_local, case_id, digest
        )

    def code_stats(self) -> list[dict]:
        return self._execute_with_fallback(self._code_stats_db, self._code_stats_local)

    # ------------------------------------------------------------------
    # DB — casos
    # ------------------------------------------------------------------

    _CASE_COLS = (
        "id, device_id, incident_id, serial, code, state, hp_action_id, customer_id, "
        "customer_name, contract_id, monitor_name, model, firmware, severity, case_type, "
        "probability, lead_days, median_days_to_failure, created_at_portal, updated_at_portal, "
        "detail, detail_fetched_at, first_seen_at, last_seen_at"
    )

    def _upsert_cases_db(self, rows: list[EngineeringCaseRow]) -> dict:
        new_cases: list[EngineeringCase] = []
        updated = 0
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                for row in rows:
                    cur.execute(
                        f"""
                        INSERT INTO sds_engineering_cases (
                            device_id, incident_id, serial, code, state, customer_id,
                            customer_name, contract_id, monitor_name, model, firmware,
                            severity, case_type, probability, lead_days,
                            median_days_to_failure, created_at_portal, updated_at_portal,
                            last_seen_at
                        )
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s, now())
                        ON CONFLICT (device_id, incident_id) DO UPDATE SET
                            serial = EXCLUDED.serial,
                            code = EXCLUDED.code,
                            state = EXCLUDED.state,
                            customer_id = EXCLUDED.customer_id,
                            customer_name = EXCLUDED.customer_name,
                            contract_id = EXCLUDED.contract_id,
                            monitor_name = EXCLUDED.monitor_name,
                            model = EXCLUDED.model,
                            firmware = EXCLUDED.firmware,
                            severity = EXCLUDED.severity,
                            case_type = EXCLUDED.case_type,
                            probability = EXCLUDED.probability,
                            lead_days = EXCLUDED.lead_days,
                            median_days_to_failure = EXCLUDED.median_days_to_failure,
                            updated_at_portal = EXCLUDED.updated_at_portal,
                            last_seen_at = now()
                        RETURNING {self._CASE_COLS}, (xmax = 0) AS is_new
                        """,
                        (
                            row.device_id,
                            row.incident_id,
                            row.serial,
                            row.code,
                            row.state,
                            row.customer_id,
                            row.customer_name,
                            row.contract_id,
                            row.monitor_name,
                            row.model,
                            row.firmware,
                            row.severity,
                            row.case_type,
                            row.probability,
                            row.lead_days,
                            row.median_days_to_failure,
                            row.created_at_portal,
                            row.updated_at_portal,
                        ),
                    )
                    record = cur.fetchone()
                    is_new = record[-1]
                    case = self._row_to_case(record[:-1])
                    if is_new:
                        new_cases.append(case)
                    else:
                        updated += 1
            conn.commit()
        return {"new": new_cases, "updated": updated, "total": len(rows)}

    def _save_detail_db(self, case_id: UUID, detail: dict, hp_action_id: str | None) -> None:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE sds_engineering_cases
                    SET detail = %s::jsonb, detail_fetched_at = now(),
                        hp_action_id = COALESCE(%s, hp_action_id)
                    WHERE id = %s
                    """,
                    (json.dumps(detail, ensure_ascii=False, default=str), hp_action_id, str(case_id)),
                )
            conn.commit()

    def _get_case_db(self, device_id: str, incident_id: str) -> Optional[EngineeringCase]:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT {self._CASE_COLS} FROM sds_engineering_cases "
                    "WHERE device_id = %s AND incident_id = %s",
                    (device_id, incident_id),
                )
                row = cur.fetchone()
        return self._row_to_case(row) if row else None

    def _get_case_by_id_db(self, case_id: UUID) -> Optional[EngineeringCase]:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT {self._CASE_COLS} FROM sds_engineering_cases WHERE id = %s",
                    (str(case_id),),
                )
                row = cur.fetchone()
        return self._row_to_case(row) if row else None

    def _list_cases_db(
        self,
        states: list[str] | None,
        severities: list[str] | None,
        codes: list[str] | None,
        serial: str | None,
        only_unanalyzed: bool,
        limit: int,
        offset: int,
    ) -> list[EngineeringCase]:
        clauses = []
        params: list[Any] = []
        if states:
            clauses.append("state = ANY(%s)")
            params.append(states)
        if severities:
            clauses.append("severity = ANY(%s)")
            params.append(severities)
        if codes:
            clauses.append("code = ANY(%s)")
            params.append(codes)
        if serial:
            clauses.append("serial = %s")
            params.append(serial.strip().upper())
        if only_unanalyzed:
            clauses.append(
                "NOT EXISTS (SELECT 1 FROM sds_engineering_analyses a WHERE a.case_id = sds_engineering_cases.id)"
            )
        where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
        params.extend([limit, offset])
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT {self._CASE_COLS} FROM sds_engineering_cases {where} "
                    "ORDER BY lead_days ASC NULLS LAST, updated_at_portal DESC "
                    "LIMIT %s OFFSET %s",
                    params,
                )
                rows = cur.fetchall()
        return [self._row_to_case(r) for r in rows]

    def _list_cases_by_ids_db(self, pairs: list[tuple[str, str]]) -> list[EngineeringCase]:
        if not pairs:
            return []
        device_ids = [p[0] for p in pairs]
        incident_ids = [p[1] for p in pairs]
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"""
                    SELECT {self._CASE_COLS} FROM sds_engineering_cases
                    WHERE (device_id, incident_id) IN (
                        SELECT * FROM unnest(%s::text[], %s::text[])
                    )
                    """,
                    (device_ids, incident_ids),
                )
                rows = cur.fetchall()
        return [self._row_to_case(r) for r in rows]

    # ------------------------------------------------------------------
    # DB — análisis
    # ------------------------------------------------------------------

    _ANALYSIS_COLS = (
        "id, case_id, group_key, veredicto, confianza, analysis, context_digest, model, "
        "run_id, corroboracion_logs, motivo_cierre_sugerido, causa_raiz, source, tokens, "
        "cost_usd, created_at"
    )

    def _save_analysis_db(
        self,
        case_id: UUID,
        group_key: str,
        veredicto: str,
        confianza: str,
        analysis: dict,
        context_digest: str,
        model: str,
        run_id: str | None,
        corroboracion_logs: str | None,
        motivo_cierre_sugerido: str | None,
        causa_raiz: str | None,
        source: str,
        tokens: dict | None,
        cost_usd: float | None,
    ) -> EngineeringAnalysis:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"""
                    INSERT INTO sds_engineering_analyses (
                        case_id, run_id, group_key, veredicto, confianza,
                        corroboracion_logs, motivo_cierre_sugerido, causa_raiz, analysis,
                        context_digest, source, model, tokens, cost_usd
                    )
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s::jsonb,%s,%s,%s,%s::jsonb,%s)
                    RETURNING {self._ANALYSIS_COLS}
                    """,
                    (
                        str(case_id),
                        run_id,
                        group_key,
                        veredicto,
                        confianza,
                        corroboracion_logs,
                        motivo_cierre_sugerido,
                        causa_raiz,
                        json.dumps(analysis, ensure_ascii=False, default=str),
                        context_digest,
                        source,
                        model,
                        json.dumps(tokens, ensure_ascii=False) if tokens else None,
                        cost_usd,
                    ),
                )
                row = cur.fetchone()
            conn.commit()
        return self._row_to_analysis(row)

    def _get_latest_analyses_db(self, case_ids: list[UUID]) -> dict[UUID, EngineeringAnalysis]:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"""
                    SELECT DISTINCT ON (case_id) {self._ANALYSIS_COLS}
                    FROM sds_engineering_analyses
                    WHERE case_id = ANY(%s::uuid[])
                    ORDER BY case_id, created_at DESC
                    """,
                    ([str(c) for c in case_ids],),
                )
                rows = cur.fetchall()
        result = {}
        for r in rows:
            analysis = self._row_to_analysis(r)
            result[analysis.case_id] = analysis
        return result

    def _get_analysis_history_db(self, case_id: UUID) -> list[EngineeringAnalysis]:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT {self._ANALYSIS_COLS} FROM sds_engineering_analyses "
                    "WHERE case_id = %s ORDER BY created_at DESC",
                    (str(case_id),),
                )
                rows = cur.fetchall()
        return [self._row_to_analysis(r) for r in rows]

    def _has_analysis_with_digest_db(self, case_id: UUID, digest: str) -> bool:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT 1 FROM sds_engineering_analyses WHERE case_id = %s AND context_digest = %s LIMIT 1",
                    (str(case_id), digest),
                )
                return cur.fetchone() is not None

    def _code_stats_db(self) -> list[dict]:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT code,
                           COUNT(*) AS total,
                           COUNT(*) FILTER (WHERE state IN ('New','Open','Postponed')) AS abiertos,
                           COUNT(*) FILTER (WHERE state = 'Closed') AS cerrados
                    FROM sds_engineering_cases
                    GROUP BY code
                    ORDER BY total DESC
                    """
                )
                rows = cur.fetchall()
        return [
            {"code": r[0], "total": r[1], "abiertos": r[2], "cerrados": r[3]} for r in rows
        ]

    # ------------------------------------------------------------------
    # Mappers
    # ------------------------------------------------------------------

    @staticmethod
    def _row_to_case(row: tuple) -> EngineeringCase:
        return EngineeringCase(
            id=row[0] if isinstance(row[0], UUID) else UUID(str(row[0])),
            device_id=row[1],
            incident_id=row[2],
            serial=row[3],
            code=row[4],
            state=row[5],
            hp_action_id=row[6],
            customer_id=row[7],
            customer_name=row[8],
            contract_id=row[9],
            monitor_name=row[10],
            model=row[11],
            firmware=row[12],
            severity=row[13],
            case_type=row[14],
            probability=row[15],
            lead_days=row[16],
            median_days_to_failure=row[17],
            created_at_portal=row[18],
            updated_at_portal=row[19],
            detail=row[20],
            detail_fetched_at=row[21],
            first_seen_at=row[22],
            last_seen_at=row[23],
        )

    @staticmethod
    def _row_to_analysis(row: tuple) -> EngineeringAnalysis:
        return EngineeringAnalysis(
            id=row[0] if isinstance(row[0], UUID) else UUID(str(row[0])),
            case_id=row[1] if isinstance(row[1], UUID) else UUID(str(row[1])),
            group_key=row[2],
            veredicto=row[3],
            confianza=row[4],
            analysis=row[5],
            context_digest=row[6],
            model=row[7],
            run_id=row[8],
            corroboracion_logs=row[9],
            motivo_cierre_sugerido=row[10],
            causa_raiz=row[11],
            source=row[12],
            tokens=row[13],
            cost_usd=float(row[14]) if row[14] is not None else None,
            created_at=row[15],
        )

    # ------------------------------------------------------------------
    # Local JSON fallback
    # ------------------------------------------------------------------

    def _load_local_cases(self) -> list[dict]:
        return self._load_json_file(_LOCAL_CASES_PATH)

    def _save_local_cases(self, items: list[dict]) -> None:
        _LOCAL_CASES_PATH.parent.mkdir(exist_ok=True)
        with open(_LOCAL_CASES_PATH, "w", encoding="utf-8") as f:
            json.dump(items, f, ensure_ascii=False, indent=2, default=str)

    def _load_local_analyses(self) -> list[dict]:
        return self._load_json_file(_LOCAL_ANALYSES_PATH)

    def _save_local_analyses(self, items: list[dict]) -> None:
        _LOCAL_ANALYSES_PATH.parent.mkdir(exist_ok=True)
        with open(_LOCAL_ANALYSES_PATH, "w", encoding="utf-8") as f:
            json.dump(items, f, ensure_ascii=False, indent=2, default=str)

    def _upsert_cases_local(self, rows: list[EngineeringCaseRow]) -> dict:
        with _local_write_lock:
            items = self._load_local_cases()
            by_key = {(i["device_id"], i["incident_id"]): i for i in items}
            new_cases: list[EngineeringCase] = []
            updated = 0
            now = datetime.now(timezone.utc)
            for row in rows:
                key = (row.device_id, row.incident_id)
                existing = by_key.get(key)
                if existing:
                    existing.update(
                        serial=row.serial,
                        code=row.code,
                        state=row.state,
                        customer_id=row.customer_id,
                        customer_name=row.customer_name,
                        contract_id=row.contract_id,
                        monitor_name=row.monitor_name,
                        model=row.model,
                        firmware=row.firmware,
                        severity=row.severity,
                        case_type=row.case_type,
                        probability=row.probability,
                        lead_days=row.lead_days,
                        median_days_to_failure=row.median_days_to_failure,
                        updated_at_portal=_iso(row.updated_at_portal),
                        last_seen_at=now.isoformat(),
                    )
                    updated += 1
                else:
                    item = {
                        "id": str(uuid4()),
                        "device_id": row.device_id,
                        "incident_id": row.incident_id,
                        "serial": row.serial,
                        "code": row.code,
                        "state": row.state,
                        "hp_action_id": None,
                        "customer_id": row.customer_id,
                        "customer_name": row.customer_name,
                        "contract_id": row.contract_id,
                        "monitor_name": row.monitor_name,
                        "model": row.model,
                        "firmware": row.firmware,
                        "severity": row.severity,
                        "case_type": row.case_type,
                        "probability": row.probability,
                        "lead_days": row.lead_days,
                        "median_days_to_failure": row.median_days_to_failure,
                        "created_at_portal": _iso(row.created_at_portal),
                        "updated_at_portal": _iso(row.updated_at_portal),
                        "detail": None,
                        "detail_fetched_at": None,
                        "first_seen_at": now.isoformat(),
                        "last_seen_at": now.isoformat(),
                    }
                    items.append(item)
                    by_key[key] = item
                    new_cases.append(self._dict_to_case(item))
            self._save_local_cases(items)
        return {"new": new_cases, "updated": updated, "total": len(rows)}

    def _save_detail_local(self, case_id: UUID, detail: dict, hp_action_id: str | None) -> None:
        with _local_write_lock:
            items = self._load_local_cases()
            for item in items:
                if item["id"] == str(case_id):
                    item["detail"] = detail
                    item["detail_fetched_at"] = datetime.now(timezone.utc).isoformat()
                    if hp_action_id:
                        item["hp_action_id"] = hp_action_id
                    self._save_local_cases(items)
                    return

    def _get_case_local(self, device_id: str, incident_id: str) -> Optional[EngineeringCase]:
        items = self._load_local_cases()
        for item in items:
            if item["device_id"] == device_id and item["incident_id"] == incident_id:
                return self._dict_to_case(item)
        return None

    def _get_case_by_id_local(self, case_id: UUID) -> Optional[EngineeringCase]:
        items = self._load_local_cases()
        for item in items:
            if item["id"] == str(case_id):
                return self._dict_to_case(item)
        return None

    def _list_cases_local(
        self,
        states: list[str] | None,
        severities: list[str] | None,
        codes: list[str] | None,
        serial: str | None,
        only_unanalyzed: bool,
        limit: int,
        offset: int,
    ) -> list[EngineeringCase]:
        items = self._load_local_cases()
        analyzed_ids = {a["case_id"] for a in self._load_local_analyses()} if only_unanalyzed else set()
        out = []
        for item in items:
            if states and item["state"] not in states:
                continue
            if severities and item.get("severity") not in severities:
                continue
            if codes and item.get("code") not in codes:
                continue
            if serial and item.get("serial") != serial.strip().upper():
                continue
            if only_unanalyzed and item["id"] in analyzed_ids:
                continue
            out.append(item)

        def sort_key(i: dict):
            lead = i.get("lead_days")
            return (lead is None, lead if lead is not None else 0)

        out.sort(key=sort_key)
        return [self._dict_to_case(i) for i in out[offset : offset + limit]]

    def _list_cases_by_ids_local(self, pairs: list[tuple[str, str]]) -> list[EngineeringCase]:
        wanted = set(pairs)
        items = self._load_local_cases()
        return [
            self._dict_to_case(i)
            for i in items
            if (i["device_id"], i["incident_id"]) in wanted
        ]

    def _save_analysis_local(
        self,
        case_id: UUID,
        group_key: str,
        veredicto: str,
        confianza: str,
        analysis: dict,
        context_digest: str,
        model: str,
        run_id: str | None,
        corroboracion_logs: str | None,
        motivo_cierre_sugerido: str | None,
        causa_raiz: str | None,
        source: str,
        tokens: dict | None,
        cost_usd: float | None,
    ) -> EngineeringAnalysis:
        with _local_write_lock:
            items = self._load_local_analyses()
            item = {
                "id": str(uuid4()),
                "case_id": str(case_id),
                "group_key": group_key,
                "veredicto": veredicto,
                "confianza": confianza,
                "analysis": analysis,
                "context_digest": context_digest,
                "model": model,
                "run_id": run_id,
                "corroboracion_logs": corroboracion_logs,
                "motivo_cierre_sugerido": motivo_cierre_sugerido,
                "causa_raiz": causa_raiz,
                "source": source,
                "tokens": tokens,
                "cost_usd": cost_usd,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            items.insert(0, item)
            self._save_local_analyses(items)
        return self._dict_to_analysis(item)

    def _get_latest_analyses_local(self, case_ids: list[UUID]) -> dict[UUID, EngineeringAnalysis]:
        wanted = {str(c) for c in case_ids}
        items = [i for i in self._load_local_analyses() if i["case_id"] in wanted]
        items.sort(key=lambda i: i["created_at"], reverse=True)
        result: dict[UUID, EngineeringAnalysis] = {}
        for item in items:
            case_id = UUID(item["case_id"])
            if case_id not in result:
                result[case_id] = self._dict_to_analysis(item)
        return result

    def _get_analysis_history_local(self, case_id: UUID) -> list[EngineeringAnalysis]:
        items = [i for i in self._load_local_analyses() if i["case_id"] == str(case_id)]
        items.sort(key=lambda i: i["created_at"], reverse=True)
        return [self._dict_to_analysis(i) for i in items]

    def _has_analysis_with_digest_local(self, case_id: UUID, digest: str) -> bool:
        items = self._load_local_analyses()
        return any(
            i["case_id"] == str(case_id) and i["context_digest"] == digest for i in items
        )

    def _code_stats_local(self) -> list[dict]:
        items = self._load_local_cases()
        stats: dict[str, dict] = {}
        for item in items:
            code = item.get("code") or "?"
            s = stats.setdefault(code, {"code": code, "total": 0, "abiertos": 0, "cerrados": 0})
            s["total"] += 1
            if item["state"] == "Closed":
                s["cerrados"] += 1
            elif item["state"] in ("New", "Open", "Postponed"):
                s["abiertos"] += 1
        return sorted(stats.values(), key=lambda s: s["total"], reverse=True)

    @staticmethod
    def _dict_to_case(item: dict) -> EngineeringCase:
        return EngineeringCase(
            id=UUID(item["id"]),
            device_id=item["device_id"],
            incident_id=item["incident_id"],
            serial=item["serial"],
            code=item["code"],
            state=item["state"],
            hp_action_id=item.get("hp_action_id"),
            customer_id=item.get("customer_id"),
            customer_name=item.get("customer_name"),
            contract_id=item.get("contract_id"),
            monitor_name=item.get("monitor_name"),
            model=item.get("model"),
            firmware=item.get("firmware"),
            severity=item.get("severity"),
            case_type=item.get("case_type"),
            probability=item.get("probability"),
            lead_days=item.get("lead_days"),
            median_days_to_failure=item.get("median_days_to_failure"),
            created_at_portal=_from_iso(item.get("created_at_portal")),
            updated_at_portal=_from_iso(item.get("updated_at_portal")),
            detail=item.get("detail"),
            detail_fetched_at=_from_iso(item.get("detail_fetched_at")),
            first_seen_at=_from_iso(item.get("first_seen_at")),
            last_seen_at=_from_iso(item.get("last_seen_at")),
        )

    @staticmethod
    def _dict_to_analysis(item: dict) -> EngineeringAnalysis:
        return EngineeringAnalysis(
            id=UUID(item["id"]),
            case_id=UUID(item["case_id"]),
            group_key=item["group_key"],
            veredicto=item["veredicto"],
            confianza=item["confianza"],
            analysis=item["analysis"],
            context_digest=item["context_digest"],
            model=item["model"],
            run_id=item.get("run_id"),
            corroboracion_logs=item.get("corroboracion_logs"),
            motivo_cierre_sugerido=item.get("motivo_cierre_sugerido"),
            causa_raiz=item.get("causa_raiz"),
            source=item.get("source", "ai"),
            tokens=item.get("tokens"),
            cost_usd=item.get("cost_usd"),
            created_at=_from_iso(item.get("created_at")),
        )

    # ------------------------------------------------------------------
    # BaseRepository abstract interface (no usada directamente por este módulo,
    # pero requerida por la clase base genérica)
    # ------------------------------------------------------------------

    def _get_by_id_db(self, entity_id: UUID):
        return self._get_case_by_id_db(entity_id)

    def _get_by_id_local(self, entity_id: UUID):
        return self._get_case_by_id_local(entity_id)

    def _get_all_db(self):
        return self._list_cases_db(None, None, None, None, False, 1000, 0)

    def _get_all_local(self):
        return self._list_cases_local(None, None, None, None, False, 1000, 0)

    def _delete_db(self, entity_id: UUID) -> int:
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM sds_engineering_cases WHERE id = %s", (str(entity_id),))
                deleted = cur.rowcount
            conn.commit()
        return deleted

    def _delete_local(self, entity_id: UUID) -> int:
        with _local_write_lock:
            items = self._load_local_cases()
            new_items = [i for i in items if i["id"] != str(entity_id)]
            deleted = len(items) - len(new_items)
            if deleted:
                self._save_local_cases(new_items)
        return deleted
