"""FastAPI interface exposing log parsing capabilities."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel

from application.config.runtime_config import ConfigService, RuntimeConfig
from application.parsers.log_parser import LogParser
from application.services.analysis_service import AnalysisService
from domain.entities import Event, Incident
from infrastructure.config import Settings, get_settings
from infrastructure.json_config_validator import JsonConfigValidator
from infrastructure.repositories.config_repository import AuditRepository, ConfigRepository


class ParseLogsRequest(BaseModel):
    """Request body containing the raw log payload."""

    logs: str


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


class ConfigResponse(BaseModel):
    """Details about the active configuration."""

    version_number: int
    version_id: str
    created_at: datetime
    created_by: str
    config: Dict[str, Any]


class ConfigHistoryItemModel(BaseModel):
    """Historical version summary."""

    version_number: int
    created_at: datetime
    created_by: str
    diff: Dict[str, List[str]]


def authenticate(api_key: str = Header(..., alias="x-api-key")) -> None:
    """Simple header-based authentication for the MVP."""
    settings = get_settings()
    if api_key != settings.api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")


def get_actor(user_id: str = Header(..., alias="x-user-id")) -> str:
    """Extract the acting user for auditing."""
    return user_id


def get_app(settings: Settings | None = None) -> FastAPI:
    """Factory mainly used for testing."""
    settings = settings or get_settings()
    parser = LogParser()
    config_repository = ConfigRepository()
    audit_repository = AuditRepository()
    validator = JsonConfigValidator()
    runtime_config = RuntimeConfig(config_repository, validator)
    config_service = ConfigService(
        repository=config_repository,
        audit_repository=audit_repository,
        runtime_config=runtime_config,
        validator=validator,
    )
    analysis_service = AnalysisService(settings=settings, runtime_config=runtime_config)
    app = FastAPI(
        title="HP Printer Logs Analyzer",
        version="0.1.0",
        description="MVP API for ingesting and parsing HP printer logs.",
    )

    @app.get("/health", summary="Basic health probe")
    def health() -> dict:
        return {"status": "ok", "recency_window": settings.recency_window}

    @app.post("/parser/preview", response_model=ParseLogsResponse, dependencies=[Depends(authenticate)])
    def parse_logs(payload: ParseLogsRequest) -> ParseLogsResponse:
        report = parser.parse_text(payload.logs)
        try:
            analysis = analysis_service.analyze(report.events)
        except RuntimeError as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        errors = [
            ParserErrorModel(line_number=e.line_number, raw_line=e.raw_line, reason=e.reason)
            for e in report.errors
        ]
        return ParseLogsResponse(
            events=report.events,
            incidents=analysis.incidents,
            global_severity=analysis.global_severity,
            errors=errors,
        )

    @app.get("/config", response_model=ConfigResponse, dependencies=[Depends(authenticate)])
    def get_config() -> ConfigResponse:
        try:
            active = config_service.get_active()
        except RuntimeError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        return ConfigResponse(
            version_number=active.version_number,
            version_id=active.version_id,
            created_at=active.created_at,
            created_by=active.created_by,
            config=active.payload.model_dump(),
        )

    @app.put("/config", response_model=ConfigResponse, dependencies=[Depends(authenticate)])
    def put_config(body: Dict[str, Any], actor: str = Depends(get_actor)) -> ConfigResponse:
        try:
            active = config_service.update(body, actor)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except RuntimeError as exc:
            raise HTTPException(status_code=500, detail=str(exc)) from exc
        return ConfigResponse(
            version_number=active.version_number,
            version_id=active.version_id,
            created_at=active.created_at,
            created_by=active.created_by,
            config=active.payload.model_dump(),
        )

    @app.get("/config/history", response_model=List[ConfigHistoryItemModel], dependencies=[Depends(authenticate)])
    def get_config_history(limit: int = 10) -> List[ConfigHistoryItemModel]:
        entries = config_service.history(limit)
        return [
            ConfigHistoryItemModel(
                version_number=item.version_number,
                created_at=item.created_at,
                created_by=item.created_by,
                diff=item.diff,
            )
            for item in entries
        ]

    return app


app = get_app()
