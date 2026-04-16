import time
import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from backend.interface.schemas.analysis import (
    ParseLogsRequest, 
    ParseLogsResponse, 
    ValidateLogsRequest, 
    ValidateLogsResponse,
    ParserErrorModel
)
from backend.interface.deps import (
    get_log_parser, 
    get_analysis_service, 
    get_error_code_repo
)
from backend.interface.auth import authenticate
from backend.interface.rate_limiter import limiter
from backend.interface.utils import normalize_log_text, enrich_events_with_catalog
from backend.application.parsers.log_parser import LogParser
from backend.application.services.analysis_service import AnalysisService
from backend.infrastructure.repositories.error_code_repository import ErrorCodeRepository, ErrorCode
from backend.domain.entities import Event, EnrichedEvent
from datetime import datetime, timezone
from typing import Dict, List

router = APIRouter(prefix="/parser", tags=["Analysis"])
_logger = logging.getLogger(__name__)

MAX_LOGS_LENGTH = 2_000_000


@router.post("/preview", response_model=ParseLogsResponse, dependencies=[Depends(authenticate)])
@limiter.limit("60/minute")
def parse_logs(
    request: Request, 
    payload: ParseLogsRequest,
    parser: LogParser = Depends(get_log_parser),
    analysis_service: AnalysisService = Depends(get_analysis_service),
    error_code_repository: ErrorCodeRepository = Depends(get_error_code_repo)
) -> ParseLogsResponse:
    if len(payload.logs) > MAX_LOGS_LENGTH:
        raise HTTPException(status_code=400, detail="logs exceeds max length")
    
    t0 = time.perf_counter()
    report = parser.parse_text(normalize_log_text(payload.logs))
    
    unique_codes = list(dict.fromkeys(e.code for e in report.events))
    catalog_map = error_code_repository.get_by_codes(unique_codes)
    
    events = enrich_events_with_catalog(report.events, catalog_map)
    try:
        analysis = analysis_service.analyze(events)
    except RuntimeError as exc:
        _logger.error("Analysis failed: %s", exc)
        raise HTTPException(status_code=503, detail="Analysis failed") from exc

    errors = [
        ParserErrorModel(line_number=e.line_number, raw_line=e.raw_line, reason=e.reason)
        for e in report.errors
    ]

    total_ms = int((time.perf_counter() - t0) * 1000)
    _logger.info("[preview] total_ms=%d", total_ms)

    start_date = events[0].timestamp.isoformat() if events else datetime.now(timezone.utc).isoformat()
    end_date = events[-1].timestamp.isoformat() if events else datetime.now(timezone.utc).isoformat()
    total_lines = len(payload.logs.splitlines())

    return ParseLogsResponse(
        events=events,
        incidents=analysis.incidents,
        global_severity=analysis.global_severity,
        errors=errors,
        log_start_date=start_date,
        log_end_date=end_date,
        total_lines=total_lines,
    )

@router.post("/validate", response_model=ValidateLogsResponse, dependencies=[Depends(authenticate)])
@limiter.limit("60/minute")
def validate_logs(
    request: Request, 
    payload: ValidateLogsRequest,
    parser: LogParser = Depends(get_log_parser),
    error_code_repository: ErrorCodeRepository = Depends(get_error_code_repo)
) -> ValidateLogsResponse:
    if len(payload.logs) > MAX_LOGS_LENGTH:
        raise HTTPException(status_code=400, detail="logs exceeds max length")
    
    lines_non_empty = [l for l in payload.logs.splitlines() if l.strip()]
    total_lines = len(lines_non_empty)
    if total_lines == 0:
        return ValidateLogsResponse(total_lines=0, codes_detected=[], codes_new=[], errors=[])

    report = parser.parse_text(normalize_log_text(payload.logs))
    codes_detected = sorted(set(e.code for e in report.events))
    catalog_map = error_code_repository.get_by_codes(codes_detected)

    codes_new = [c for c in codes_detected if c not in catalog_map]
    errors = [
        ParserErrorModel(line_number=e.line_number, raw_line=e.raw_line, reason=e.reason)
        for e in report.errors
    ]

    return ValidateLogsResponse(
        total_lines=total_lines,
        codes_detected=codes_detected,
        codes_new=codes_new,
        errors=errors,
    )
