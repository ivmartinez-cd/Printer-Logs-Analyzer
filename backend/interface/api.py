"""FastAPI interface exposing log parsing capabilities."""

from __future__ import annotations

import logging
import time

logging.basicConfig(level=logging.INFO, format="%(name)s %(levelname)s: %(message)s")
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import Depends, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

from backend.application.parsers.log_parser import LogParser
from backend.application.services.analysis_service import AnalysisService
from backend.application.services.compare_service import calculate_trend
from backend.application.services.consumable_warning_service import compute_consumable_warnings
from backend.domain.entities import ConsumableWarning, EnrichedEvent, Event, Incident
from backend.infrastructure.config import Settings, get_settings
from backend.infrastructure.content_fetcher import fetch_solution_content, validate_ssrf_url
from backend.infrastructure.database import Database
from backend.infrastructure.repositories.error_code_repository import ErrorCode, ErrorCodeRepository
from backend.infrastructure.repositories.printer_model_repository import (
    PrinterModelRepository,
)
from backend.infrastructure.repositories.saved_analysis_repository import (
    SavedAnalysisRepository,
    SavedAnalysisSnapshot,
)
from backend.application.services.pdf_extraction_service import extract_model_from_pdf
from backend.interface.auth import authenticate as _authenticate_from_module


MAX_LOGS_LENGTH = 2_000_000


def _normalize_log_text(text: str) -> str:
    """Replace runs of 2+ spaces with a single tab (HP portal copies tabs as spaces)."""
    import re
    lines = text.splitlines()
    normalized = [re.sub(r" {2,}", "\t", line) for line in lines]
    return "\n".join(normalized)


class ParseLogsRequest(BaseModel):
    """Request body containing the raw log payload."""

    logs: str
    model_id: Optional[UUID] = None


class ValidateLogsRequest(BaseModel):
    """Request body for log validation (codes detection)."""

    logs: str


class ValidateLogsResponse(BaseModel):
    """Response of POST /parser/validate."""

    total_lines: int
    codes_detected: List[str]
    codes_new: List[str]
    errors: List[ParserErrorModel]


class ParserErrorModel(BaseModel):
    """Serializable representation of parser errors."""

    line_number: int
    raw_line: str
    reason: str


class ParseLogsResponse(BaseModel):
    """Parser + analysis response."""

    events: list[Event]
    incidents: list[Incident]
    global_severity: str
    errors: list[ParserErrorModel]
    consumable_warnings: list[ConsumableWarning] = []


class ErrorCodeUpsertRequest(BaseModel):
    """Body for POST /error-codes/upsert."""

    code: str
    severity: Optional[str] = None
    description: Optional[str] = None
    solution_url: Optional[str] = None


# --- Saved analyses (incidents) ---

class SavedAnalysisIncidentItem(BaseModel):
    """One incident item for JSONB (resumido, sin events)."""

    code: str
    classification: str
    severity: str
    occurrences: int
    start_time: str
    end_time: str
    counter_range: List[int]
    sds_link: Optional[str] = None
    last_event_time: Optional[str] = None


class SavedAnalysisCreateRequest(BaseModel):
    """Body for POST /saved-analyses."""

    name: str
    equipment_identifier: Optional[str] = None
    incidents: List[SavedAnalysisIncidentItem]
    global_severity: str = "INFO"


class CompareLogsRequest(BaseModel):
    """Body for POST /saved-analyses/{id}/compare."""

    logs: str


# --- AI Diagnose ---

class AiDiagnoseIncidentItem(BaseModel):
    """Incidente compacto para diagnóstico AI (sin eventos individuales)."""

    code: str
    description: Optional[str] = None
    severity: str
    occurrences: int
    start_time: str
    end_time: str
    # NOTE: patrón temporal pre-calculado por el frontend (opcional).
    # Si no se envía, el modelo trabaja sin él.
    pattern: Optional[str] = None


class AiDiagnoseMetadata(BaseModel):
    """Metadatos del análisis para darle contexto al modelo."""

    total_events: Optional[int] = None
    date_range: Optional[str] = None
    firmware: Optional[str] = None
    counter_range: Optional[List[int]] = None


class AiDiagnoseRequest(BaseModel):
    """Body para POST /analysis/ai-diagnose."""

    incidents: List[AiDiagnoseIncidentItem]
    global_severity: str
    metadata: Optional[AiDiagnoseMetadata] = None


class AiDiagnoseResponse(BaseModel):
    """Respuesta del diagnóstico AI."""

    diagnosis: str
    model: str
    tokens_used: Dict[str, int]
    cost_usd: float


def _incident_to_summary(inc: Incident) -> dict:
    """Build summary dict for JSONB (code, classification, severity, occurrences, start_time, end_time, counter_range, sds_link, last_event_time)."""
    end_iso = inc.end_time.isoformat() if inc.end_time else None
    start_iso = inc.start_time.isoformat() if inc.start_time else None
    return {
        "code": inc.code,
        "classification": inc.classification,
        "severity": inc.severity,
        "occurrences": inc.occurrences,
        "start_time": start_iso,
        "end_time": end_iso,
        "counter_range": list(inc.counter_range),
        "sds_link": inc.sds_link,
        "last_event_time": end_iso,
    }


def _compute_diff(
    saved: SavedAnalysisSnapshot,
    current_incidents: List[Incident],
) -> dict:
    """Build diff: codigos_nuevos, codigos_desaparecidos, cambios_ocurrencias, diferencia_dias. Tendencia se asigna con compare_service.calculate_trend."""
    saved_codes = {i["code"]: i for i in saved.incidents}
    current_by_code = {inc.code: inc for inc in current_incidents}
    current_codes = set(current_by_code.keys())
    saved_codes_set = set(saved_codes.keys())

    codigos_nuevos = list(current_codes - saved_codes_set)
    codigos_desaparecidos = list(saved_codes_set - current_codes)
    cambios_ocurrencias: List[dict] = []
    for code in saved_codes_set & current_codes:
        so = saved_codes[code].get("occurrences") or 0
        co = current_by_code[code].occurrences
        if so != co:
            cambios_ocurrencias.append({
                "code": code,
                "saved_occurrences": so,
                "current_occurrences": co,
                "delta": co - so,
            })

    now = datetime.now(timezone.utc)
    saved_dt = saved.created_at
    if saved_dt.tzinfo is None:
        saved_dt = saved_dt.replace(tzinfo=timezone.utc)
    try:
        diff_seconds = (now - saved_dt).total_seconds()
        diferencia_dias = max(0, int(diff_seconds / 86400))
    except Exception:
        diferencia_dias = 0

    return {
        "codigos_nuevos": codigos_nuevos,
        "codigos_desaparecidos": codigos_desaparecidos,
        "cambios_ocurrencias": cambios_ocurrencias,
        "diferencia_dias": diferencia_dias,
    }


authenticate = _authenticate_from_module


def get_app(settings: Settings | None = None) -> FastAPI:
    """Factory mainly used for testing."""
    settings = settings or get_settings()
    parser = LogParser()
    analysis_service = AnalysisService()
    database_instance = Database()
    error_code_repository = ErrorCodeRepository(database_instance)
    saved_analysis_repository = SavedAnalysisRepository(database_instance)
    printer_model_repository = PrinterModelRepository(database_instance)
    app = FastAPI(
        title="HP Printer Logs Analyzer",
        version="0.1.0",
        description="MVP API for ingesting and parsing HP printer logs.",
    )
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "https://printer-logs-analyzer.vercel.app",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
        ],
        allow_credentials=True,
        allow_methods=["GET", "POST", "DELETE"],
        allow_headers=["Content-Type", "x-api-key"],
    )


    @app.get("/health", summary="Basic health probe")
    def health() -> dict:
        db_ok = database_instance.is_available()
        return {
            "status": "ok",
            "recency_window": settings.recency_window,
            "db_mode": "postgres" if db_ok else "local_fallback",
            "db_available": db_ok,
        }

    def _enrich_events_with_catalog(events: list[Event], catalog_map: Dict[str, ErrorCode]) -> list[EnrichedEvent]:
        enriched: list[EnrichedEvent] = []
        for evt in events:
            row = catalog_map.get(evt.code)
            data = evt.model_dump()
            if row:
                data["code_severity"] = row.severity
                data["code_description"] = row.description
                data["code_solution_url"] = row.solution_url
                data["code_solution_content"] = row.solution_content
            enriched.append(EnrichedEvent(**data))
        return enriched

    @app.post("/parser/preview", response_model=ParseLogsResponse, dependencies=[Depends(authenticate)])
    @limiter.limit("60/minute")
    def parse_logs(request: Request, payload: ParseLogsRequest) -> ParseLogsResponse:
        if len(payload.logs) > MAX_LOGS_LENGTH:
            raise HTTPException(status_code=400, detail="logs exceeds max length")
        t0 = time.perf_counter()
        t_parse_start = time.perf_counter()
        report = parser.parse_text(_normalize_log_text(payload.logs))
        parse_ms = int((time.perf_counter() - t_parse_start) * 1000)

        unique_codes = list(dict.fromkeys(e.code for e in report.events))
        t_db_start = time.perf_counter()
        catalog_map = error_code_repository.get_by_codes(unique_codes)
        db_ms = int((time.perf_counter() - t_db_start) * 1000)
        t_analysis_start = time.perf_counter()

        events = _enrich_events_with_catalog(report.events, catalog_map)
        try:
            analysis = analysis_service.analyze(events)
        except RuntimeError as exc:
            logging.error("Analysis failed: %s", exc)
            raise HTTPException(status_code=503, detail="Analysis failed") from exc
        analysis_ms = int((time.perf_counter() - t_analysis_start) * 1000)

        errors = [
            ParserErrorModel(line_number=e.line_number, raw_line=e.raw_line, reason=e.reason)
            for e in report.errors
        ]

        consumable_warnings: list[ConsumableWarning] = []
        if payload.model_id is not None:
            try:
                from backend.infrastructure.database import DatabaseUnavailableError as _DBErr
                _model, consumables = printer_model_repository.get_with_consumables(payload.model_id)
                max_counter = max((e.counter for e in events if e.counter > 0), default=0)
                consumable_warnings = compute_consumable_warnings(events, consumables, max_counter)
            except Exception as exc:
                logging.warning("[preview] consumable_warnings skipped: %s", exc)

        total_ms = int((time.perf_counter() - t0) * 1000)
        logging.info("[preview] parse_ms=%d db_ms=%d analysis_ms=%d total_ms=%d", parse_ms, db_ms, analysis_ms, total_ms)
        return ParseLogsResponse(
            events=events,
            incidents=analysis.incidents,
            global_severity=analysis.global_severity,
            errors=errors,
            consumable_warnings=consumable_warnings,
        )

    @app.post("/parser/validate", response_model=ValidateLogsResponse, dependencies=[Depends(authenticate)])
    @limiter.limit("60/minute")
    def validate_logs(request: Request, payload: ValidateLogsRequest) -> ValidateLogsResponse:
        t0 = time.perf_counter()
        if len(payload.logs) > MAX_LOGS_LENGTH:
            raise HTTPException(
                status_code=400,
                detail="logs exceeds max length",
            )
        lines_non_empty = [l for l in payload.logs.splitlines() if l.strip()]
        total_lines = len(lines_non_empty)
        if total_lines == 0:
            return ValidateLogsResponse(
                total_lines=0,
                codes_detected=[],
                codes_new=[],
                errors=[],
            )

        t_parse_start = time.perf_counter()
        report = parser.parse_text(_normalize_log_text(payload.logs))
        parse_ms = int((time.perf_counter() - t_parse_start) * 1000)

        codes_detected = sorted(set(e.code for e in report.events))
        t_db_start = time.perf_counter()
        catalog_map = error_code_repository.get_by_codes(codes_detected)
        db_ms = int((time.perf_counter() - t_db_start) * 1000)

        codes_new = [c for c in codes_detected if c not in catalog_map]
        errors = [
            ParserErrorModel(line_number=e.line_number, raw_line=e.raw_line, reason=e.reason)
            for e in report.errors
        ]
        total_ms = int((time.perf_counter() - t0) * 1000)
        logging.info("[validate] parse_ms=%d db_ms=%d total_ms=%d", parse_ms, db_ms, total_ms)

        return ValidateLogsResponse(
            total_lines=total_lines,
            codes_detected=codes_detected,
            codes_new=codes_new,
            errors=errors,
        )

    @app.post("/error-codes/upsert", dependencies=[Depends(authenticate)])
    @limiter.limit("30/minute")
    async def upsert_error_code(request: Request, body: ErrorCodeUpsertRequest) -> dict:
        """Insert or update an error code in the catalog."""
        solution_content: str | None = None
        content_fetch_warning: str | None = None
        if body.solution_url and body.solution_url.strip():
            validate_ssrf_url(body.solution_url.strip())
            solution_content = await fetch_solution_content(body.solution_url.strip())
            if solution_content is None:
                content_fetch_warning = "No se pudo obtener el contenido de la página (token vencido o URL inaccesible). Se guardó el link de todas formas."
        ec = error_code_repository.upsert(
            code=body.code,
            severity=body.severity,
            description=body.description,
            solution_url=body.solution_url,
            solution_content=solution_content,
        )
        result: dict = {
            "id": ec.id,
            "code": ec.code,
            "severity": ec.severity,
            "description": ec.description,
            "solution_url": ec.solution_url,
            "solution_content": ec.solution_content,
            "solution_content_saved": ec.solution_content is not None,
            "created_at": ec.created_at.isoformat(),
            "updated_at": ec.updated_at.isoformat(),
        }
        if content_fetch_warning:
            result["warning"] = content_fetch_warning
        return result

    # --- Saved analyses (incidents) ---

    @app.post("/saved-analyses", dependencies=[Depends(authenticate)])
    def create_saved_analysis(body: SavedAnalysisCreateRequest) -> dict:
        """Save current analysis as an incident for later comparison."""
        incidents_payload = [i.model_dump() for i in body.incidents]
        snap = saved_analysis_repository.create(
            name=body.name,
            equipment_identifier=body.equipment_identifier,
            incidents=incidents_payload,
            global_severity=body.global_severity,
        )
        return {
            "id": str(snap.id),
            "name": snap.name,
            "equipment_identifier": snap.equipment_identifier,
            "global_severity": snap.global_severity,
            "created_at": snap.created_at.isoformat(),
        }

    @app.get("/saved-analyses", dependencies=[Depends(authenticate)])
    def list_saved_analyses() -> list:
        """List all saved analyses (id, name, equipment_identifier, global_severity, created_at)."""
        items = saved_analysis_repository.list()
        return [
            {
                "id": str(s.id),
                "name": s.name,
                "equipment_identifier": s.equipment_identifier,
                "global_severity": s.global_severity,
                "created_at": s.created_at.isoformat(),
            }
            for s in items
        ]

    @app.get("/saved-analyses/{id}", dependencies=[Depends(authenticate)])
    def get_saved_analysis(id: str) -> dict:
        """Get full snapshot of a saved analysis."""
        from uuid import UUID
        try:
            uid = UUID(id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid id")
        snap = saved_analysis_repository.get_by_id(uid)
        if not snap:
            raise HTTPException(status_code=404, detail="Saved analysis not found")
        return {
            "id": str(snap.id),
            "name": snap.name,
            "equipment_identifier": snap.equipment_identifier,
            "incidents": snap.incidents,
            "global_severity": snap.global_severity,
            "created_at": snap.created_at.isoformat(),
        }

    @app.delete("/saved-analyses/{id}", status_code=204, dependencies=[Depends(authenticate)])
    def delete_saved_analysis(id: str) -> None:
        """Delete a saved analysis by id."""
        from uuid import UUID
        try:
            uid = UUID(id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid id")
        deleted = saved_analysis_repository.delete(uid)
        if not deleted:
            raise HTTPException(status_code=404, detail="Saved analysis not found")

    @app.post("/saved-analyses/{id}/compare", dependencies=[Depends(authenticate)])
    def compare_saved_analysis(id: str, body: CompareLogsRequest) -> dict:
        """Parse and analyze new log, then return saved snapshot + current result + diff."""
        from uuid import UUID
        try:
            uid = UUID(id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid id")
        snap = saved_analysis_repository.get_by_id(uid)
        if not snap:
            raise HTTPException(status_code=404, detail="Saved analysis not found")
        if len(body.logs) > MAX_LOGS_LENGTH:
            raise HTTPException(status_code=400, detail="logs exceeds max length")

        report = parser.parse_text(_normalize_log_text(body.logs))
        unique_codes = list(dict.fromkeys(e.code for e in report.events))
        catalog_map = error_code_repository.get_by_codes(unique_codes)
        events = _enrich_events_with_catalog(report.events, catalog_map)
        try:
            analysis = analysis_service.analyze(events)
        except RuntimeError as exc:
            logging.error("Analysis failed: %s", exc)
            raise HTTPException(status_code=503, detail="Analysis failed") from exc

        errors = [
            ParserErrorModel(line_number=e.line_number, raw_line=e.raw_line, reason=e.reason)
            for e in report.errors
        ]
        diff = _compute_diff(snap, analysis.incidents)
        diff["tendencia"] = calculate_trend(snap.incidents, analysis.incidents, diff)

        def _serialize_incident(inc: Incident) -> dict:
            return {
                "id": inc.id,
                "code": inc.code,
                "classification": inc.classification,
                "severity": inc.severity,
                "severity_weight": inc.severity_weight,
                "occurrences": inc.occurrences,
                "start_time": inc.start_time.isoformat() if inc.start_time else None,
                "end_time": inc.end_time.isoformat() if inc.end_time else None,
                "counter_range": list(inc.counter_range),
                "events": [e.model_dump() for e in inc.events],
                "sds_link": inc.sds_link,
                "sds_solution_content": inc.sds_solution_content,
            }

        return {
            "saved": {
                "id": str(snap.id),
                "name": snap.name,
                "equipment_identifier": snap.equipment_identifier,
                "incidents": snap.incidents,
                "global_severity": snap.global_severity,
                "created_at": snap.created_at.isoformat(),
            },
            "current": {
                "events": [e.model_dump() for e in events],
                "incidents": [_serialize_incident(i) for i in analysis.incidents],
                "global_severity": analysis.global_severity,
                "errors": errors,
            },
            "diff": diff,
        }

    @app.post(
        "/analysis/ai-diagnose",
        response_model=AiDiagnoseResponse,
        dependencies=[Depends(authenticate)],
    )
    @limiter.limit("20/minute")
    async def ai_diagnose(request: Request, body: AiDiagnoseRequest) -> AiDiagnoseResponse:
        """Genera un diagnóstico automático del log usando Claude Haiku.

        El frontend manda el result ya calculado — el backend NO re-parsea el log.
        Retorna 503 si ANTHROPIC_API_KEY no está configurada.
        """
        import anthropic as _anthropic

        from backend.application.services.ai_diagnosis_service import (
            MODEL,
            call_claude,
            compute_cost,
        )

        api_key = settings.anthropic_api_key
        if not api_key:
            raise HTTPException(
                status_code=503,
                detail="Servicio de diagnóstico AI no disponible: ANTHROPIC_API_KEY no configurada.",
            )

        # Armar payload compacto para el modelo (ordenado por severidad desc)
        severity_order = {"ERROR": 3, "WARNING": 2, "INFO": 1}
        sorted_incidents = sorted(
            body.incidents,
            key=lambda i: (severity_order.get(i.severity, 0), i.occurrences),
            reverse=True,
        )
        payload: Dict[str, Any] = {
            "global_severity": body.global_severity,
            "incidents": [
                {
                    "code": inc.code,
                    **({"description": inc.description} if inc.description else {}),
                    "severity": inc.severity,
                    "occurrences": inc.occurrences,
                    "start": inc.start_time,
                    "end": inc.end_time,
                    **({"pattern": inc.pattern} if inc.pattern else {}),
                }
                for inc in sorted_incidents
            ],
        }
        if body.metadata:
            meta = {k: v for k, v in body.metadata.model_dump().items() if v is not None}
            if meta:
                payload["metadata"] = meta

        try:
            diagnosis, tokens = await call_claude(payload, api_key)
        except _anthropic.AuthenticationError as exc:
            logging.error("[ai-diagnose] AuthenticationError: %s", exc)
            raise HTTPException(status_code=503, detail="API key de Anthropic inválida.") from exc
        except _anthropic.RateLimitError as exc:
            logging.error("[ai-diagnose] RateLimitError: %s", exc)
            raise HTTPException(
                status_code=429,
                detail="Rate limit de Anthropic alcanzado. Reintentar en unos minutos.",
            ) from exc
        except _anthropic.APIConnectionError as exc:
            logging.error("[ai-diagnose] APIConnectionError: %s", exc)
            raise HTTPException(
                status_code=503, detail="Error de conexión con la API de Anthropic."
            ) from exc
        except _anthropic.APIError as exc:
            logging.error("[ai-diagnose] APIError %s: %s", type(exc).__name__, exc)
            raise HTTPException(status_code=503, detail="Error de la API de Anthropic.") from exc

        cost = compute_cost(tokens)
        logging.info("[ai-diagnose] tokens=%s cost_usd=%.6f", tokens, cost)

        return AiDiagnoseResponse(
            diagnosis=diagnosis,
            model=MODEL,
            tokens_used=tokens,
            cost_usd=cost,
        )

    # --- Printer models ---

    _PDF_MAX_BYTES = 10 * 1024 * 1024  # 10 MB

    @app.get("/printer-models", dependencies=[Depends(authenticate)])
    def list_printer_models() -> list:
        """List all printer models (without consumables)."""
        from backend.infrastructure.database import DatabaseUnavailableError as _DBErr

        try:
            models = printer_model_repository.list_models()
        except _DBErr:
            return []
        return [
            {
                "id": str(m.id),
                "model_name": m.model_name,
                "model_code": m.model_code,
                "family": m.family,
                "ampv": m.ampv,
                "engine_life_pages": m.engine_life_pages,
                "notes": m.notes,
                "created_at": m.created_at.isoformat(),
                "updated_at": m.updated_at.isoformat(),
            }
            for m in models
        ]

    @app.post("/printer-models/upload-pdf", dependencies=[Depends(authenticate)])
    @limiter.limit("10/minute")
    async def upload_printer_model_pdf(
        request: Request,
        file: UploadFile = File(...),
    ) -> dict:
        """Upload a Service Cost Data PDF and extract printer models via Claude API."""
        import anthropic as _anthropic
        import psycopg2.errors
        from backend.infrastructure.database import DatabaseUnavailableError as _DBErr

        if file.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="El archivo debe ser un PDF (application/pdf)")

        pdf_bytes = await file.read()
        if len(pdf_bytes) > _PDF_MAX_BYTES:
            raise HTTPException(status_code=400, detail="El PDF supera el límite de 10 MB")

        api_key = settings.anthropic_api_key
        if not api_key:
            raise HTTPException(
                status_code=503,
                detail="Servicio no disponible: ANTHROPIC_API_KEY no configurada.",
            )

        try:
            extracted = await extract_model_from_pdf(pdf_bytes, api_key)
        except _anthropic.AuthenticationError as exc:
            logging.error("[upload-pdf] AuthenticationError: %s", exc)
            raise HTTPException(status_code=503, detail="API key de Anthropic inválida") from exc
        except ValueError as exc:
            logging.warning("[upload-pdf] ValueError parsing Claude response: %s", exc)
            raise HTTPException(status_code=422, detail=str(exc)) from exc

        created: list[str] = []
        skipped: list[str] = []
        total_consumables = 0

        for model_dict in extracted.get("models", []):
            model_code = model_dict.get("model_code", "")
            consumables = model_dict.pop("consumables", []) or []
            try:
                printer_model_repository.create_with_consumables(model_dict, consumables)
                created.append(model_code)
                total_consumables += len(consumables)
            except psycopg2.errors.UniqueViolation:
                logging.warning("[upload-pdf] model_code=%s ya existe, saltando", model_code)
                skipped.append(model_code)
            except _DBErr as exc:
                logging.error("[upload-pdf] DatabaseUnavailableError: %s", exc)
                raise HTTPException(status_code=503, detail="DB no disponible") from exc
            except Exception as exc:
                logging.error("[upload-pdf] Error inesperado creando modelo %s: %s", model_code, exc)
                raise HTTPException(status_code=500, detail="Error interno del servidor") from exc

        return {"created": created, "skipped": skipped, "total_consumables": total_consumables}

    return app


app = get_app()
