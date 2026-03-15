"""FastAPI interface exposing log parsing capabilities."""

from __future__ import annotations

import hashlib
import time
from typing import Dict, List, Optional

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from application.parsers.log_parser import LogParser
from application.services.analysis_service import AnalysisService
from domain.entities import Event, Incident
from infrastructure.config import Settings, get_settings
from infrastructure.repositories.error_code_repository import ErrorCode, ErrorCodeRepository

MAX_LOGS_LENGTH = 2_000_000

# Single-slot cache for preview: same input -> return cached result (no parse/DB/analysis).
_preview_cache: Dict[str, Optional[object]] = {"hash": None, "response": None}


class ParseLogsRequest(BaseModel):
    """Request body containing the raw log payload."""

    logs: str


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


class ErrorCodeUpsertRequest(BaseModel):
    """Body for POST /error-codes/upsert."""

    code: str
    severity: Optional[str] = None
    description: Optional[str] = None
    solution_url: Optional[str] = None


def authenticate(api_key: str = Header(..., alias="x-api-key")) -> None:
    """Simple header-based authentication for the MVP."""
    settings = get_settings()
    if api_key != settings.api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")


def get_app(settings: Settings | None = None) -> FastAPI:
    """Factory mainly used for testing."""
    settings = settings or get_settings()
    parser = LogParser()
    analysis_service = AnalysisService()
    error_code_repository = ErrorCodeRepository()
    app = FastAPI(
        title="HP Printer Logs Analyzer",
        version="0.1.0",
        description="MVP API for ingesting and parsing HP printer logs.",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", summary="Basic health probe")
    def health() -> dict:
        return {"status": "ok", "recency_window": settings.recency_window}

    def _enrich_events_with_catalog(events: list[Event], catalog_map: Dict[str, ErrorCode]) -> list[Event]:
        enriched: list[Event] = []
        for evt in events:
            row = catalog_map.get(evt.code)
            if row:
                data = evt.model_dump()
                data["code_severity"] = row.severity
                data["code_description"] = row.description
                data["code_solution_url"] = row.solution_url
                enriched.append(Event(**data))
            else:
                enriched.append(evt)
        return enriched

    @app.post("/parser/preview", response_model=ParseLogsResponse, dependencies=[Depends(authenticate)])
    def parse_logs(payload: ParseLogsRequest) -> ParseLogsResponse:
        t0 = time.perf_counter()
        logs_hash = hashlib.sha256(payload.logs.encode("utf-8")).hexdigest()
        if _preview_cache["hash"] == logs_hash and _preview_cache["response"] is not None:
            elapsed_ms = int((time.perf_counter() - t0) * 1000)
            print(f"[preview] cache_hit=true total_ms={elapsed_ms}")
            return _preview_cache["response"]

        t_parse_start = time.perf_counter()
        report = parser.parse_text(payload.logs)
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
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        analysis_ms = int((time.perf_counter() - t_analysis_start) * 1000)

        errors = [
            ParserErrorModel(line_number=e.line_number, raw_line=e.raw_line, reason=e.reason)
            for e in report.errors
        ]
        response = ParseLogsResponse(
            events=events,
            incidents=analysis.incidents,
            global_severity=analysis.global_severity,
            errors=errors,
        )
        _preview_cache["hash"] = logs_hash
        _preview_cache["response"] = response

        total_ms = int((time.perf_counter() - t0) * 1000)
        print(f"[preview] parse_ms={parse_ms} db_ms={db_ms} analysis_ms={analysis_ms} total_ms={total_ms}")
        return response

    @app.post("/parser/validate", response_model=ValidateLogsResponse, dependencies=[Depends(authenticate)])
    def validate_logs(payload: ValidateLogsRequest) -> ValidateLogsResponse:
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
        report = parser.parse_text(payload.logs)
        parse_ms = int((time.perf_counter() - t_parse_start) * 1000)

        codes_detected = sorted(set(e.code for e in report.events))
        catalog_map = error_code_repository.get_by_codes(codes_detected)
        db_ms = int((time.perf_counter() - t_parse_start) * 1000) - parse_ms

        codes_new = [c for c in codes_detected if c not in catalog_map]
        errors = [
            ParserErrorModel(line_number=e.line_number, raw_line=e.raw_line, reason=e.reason)
            for e in report.errors
        ]
        total_ms = int((time.perf_counter() - t0) * 1000)
        print(f"[validate] parse_ms={parse_ms} db_ms={db_ms} total_ms={total_ms}")

        return ValidateLogsResponse(
            total_lines=total_lines,
            codes_detected=codes_detected,
            codes_new=codes_new,
            errors=errors,
        )

    @app.post("/error-codes/upsert", dependencies=[Depends(authenticate)])
    def upsert_error_code(body: ErrorCodeUpsertRequest) -> dict:
        """Insert or update an error code in the catalog."""
        _preview_cache["hash"] = None
        _preview_cache["response"] = None
        ec = error_code_repository.upsert(
            code=body.code,
            severity=body.severity,
            description=body.description,
            solution_url=body.solution_url,
        )
        return {
            "id": ec.id,
            "code": ec.code,
            "severity": ec.severity,
            "description": ec.description,
            "solution_url": ec.solution_url,
            "created_at": ec.created_at.isoformat(),
            "updated_at": ec.updated_at.isoformat(),
        }

    return app


app = get_app()
