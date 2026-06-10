import logging
from datetime import datetime
from typing import Any, Dict

from backend.infrastructure.config import Settings
from backend.interface.auth import authenticate
from backend.interface.deps import get_settings
from backend.interface.rate_limiter import limiter
from backend.interface.schemas.ai import (
    AiDiagnoseRequest,
    AiDiagnoseResponse,
    AiPdfSummaryRequest,
    AiPdfSummaryResponse,
)
from fastapi import APIRouter, Depends, HTTPException, Request

router = APIRouter(prefix="/analysis", tags=["AI Diagnosis"])
_logger = logging.getLogger(__name__)


@router.post(
    "/ai-diagnose",
    response_model=AiDiagnoseResponse,
    dependencies=[Depends(authenticate)],
    summary="Generate technical diagnosis using AI",
    response_description="Markdown-formatted diagnosis, model info, and cost metadata.",
)
@limiter.limit("100/minute")
async def ai_diagnose(
    request: Request, body: AiDiagnoseRequest, settings: Settings = Depends(get_settings)
) -> AiDiagnoseResponse:
    """Generate a technical diagnosis using Anthropic Claude."""
    from backend.application.services.ai_diagnosis_service import (
        MODEL,
        call_claude,
        compute_cost,
    )

    api_key = settings.anthropic_api_key
    if not api_key:
        raise HTTPException(status_code=503, detail="ANTHROPIC_API_KEY no configurada.")

    # 1. Prepare repositories and session
    from backend.application.services.sds_web_service import get_session as get_sds_session
    from backend.infrastructure.content_fetcher import fetch_solution_content
    from backend.infrastructure.repositories.error_code_repository import ErrorCodeRepository

    error_code_repo = ErrorCodeRepository()
    sds_session = get_sds_session(settings)

    # 2. Enrich incidents with technical data
    codes = [inc.code for inc in body.incidents]
    catalog = error_code_repo.get_by_codes(codes)

    enriched_incidents = []
    for inc in body.incidents:
        item = {
            "code": inc.code,
            "severity": inc.severity,
            "occurrences": inc.occurrences,
            "start": inc.start_time,
            "end": inc.end_time,
        }
        if inc.description:
            item["description"] = inc.description
        if inc.pattern:
            item["pattern"] = inc.pattern

        # Fetch technical solution text
        error_info = catalog.get(inc.code)
        solution_text = None

        if error_info:
            # Use cached content if available
            if error_info.solution_content and error_info.solution_content.strip():
                solution_text = error_info.solution_content
            # Otherwise try to fetch it live if we have a URL
            elif error_info.solution_url:
                _logger.info("Live-fetching technical solution for %s", inc.code)
                solution_text = await fetch_solution_content(
                    error_info.solution_url, sds_session=sds_session
                )
                if solution_text:
                    # Cache it for next time
                    try:
                        error_code_repo.upsert(code=inc.code, solution_content=solution_text)
                    except Exception as e:
                        _logger.warning("Failed to cache solution for %s: %s", inc.code, e)

        if solution_text:
            # Limit length to avoid blowing up the prompt (take first 3000 chars)
            item["technical_solution"] = solution_text[:3000].strip()

        enriched_incidents.append(item)

    payload: Dict[str, Any] = {
        "global_severity": body.global_severity,
        "incidents": enriched_incidents,
    }

    if body.metadata:
        meta = {k: v for k, v in body.metadata.model_dump().items() if v is not None}
        if meta:
            payload["metadata"] = meta

    # Claude exceptions are handled by global handler or let them bubble up
    # However, to map Anthropic specific errors to nice messages, I could do it here or in the global handler.
    # I'll let them bubble up for now or just simplify.

    try:
        diagnosis, tokens = await call_claude(payload, api_key)
        cost = compute_cost(tokens)

        # Extraer campos del JSON de diagnóstico
        tareas_resumen: str | None = None
        urgencia: str | None = None
        despacho: str | None = None
        despacho_motivo: str | None = None
        try:
            import json as _json
            _parsed = _json.loads(diagnosis)
            tareas_resumen = _parsed.get("tareas_resumen") or None
            urgencia = _parsed.get("urgencia") or None
            despacho = _parsed.get("despacho") or None
            despacho_motivo = _parsed.get("despacho_motivo") or None
        except Exception:
            pass

        # 3. AUTO-SAVE: Automatically save this AI diagnosis to the database
        try:
            from backend.interface.deps import _db
            from backend.infrastructure.repositories.saved_analysis_repository import SavedAnalysisRepository
            from backend.interface.utils import incident_to_summary

            save_repo = SavedAnalysisRepository(_db)

            # Metadata extraction for the record
            metadata = body.metadata
            serial = (
                metadata.serial_number if metadata and metadata.serial_number else "Desconocido"
            )

            analysis_name = f"AI - {serial} - {datetime.now().strftime('%d/%m %H:%M')}"

            # Simple conversion of request incidents for persistence
            persistence_incidents = [
                {
                    "code": inc.code,
                    "classification": inc.description or inc.code,
                    "severity": inc.severity,
                    "occurrences": inc.occurrences,
                    "start_time": inc.start_time,
                    "end_time": inc.end_time,
                    "counter_range": [0, 0],
                }
                for inc in body.incidents
            ]

            save_repo.create(
                name=analysis_name,
                incidents=persistence_incidents,
                global_severity=body.global_severity,
                equipment_identifier=serial,
                ai_diagnosis=diagnosis,
            )
            _logger.info("Auto-saved AI diagnosis for %s", serial)
        except Exception as save_exc:
            _logger.warning("Failed to auto-save AI diagnosis: %s", save_exc)

        return AiDiagnoseResponse(
            diagnosis=diagnosis,
            tareas_resumen=tareas_resumen,
            urgencia=urgencia,
            despacho=despacho,
            despacho_motivo=despacho_motivo,
            model=MODEL,
            tokens_used=tokens,
            cost_usd=cost,
        )
    except Exception as e:
        _logger.error(f"FATAL ERROR IN AI DIAGNOSIS: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno en la IA: {str(e)}") from e


@router.post(
    "/pdf-summary",
    response_model=AiPdfSummaryResponse,
    dependencies=[Depends(authenticate)],
    summary="Genera un resumen ejecutivo para PDF usando IA",
)
@limiter.limit("100/minute")
async def ai_pdf_summary(
    request: Request, body: AiPdfSummaryRequest, settings: Settings = Depends(get_settings)
) -> AiPdfSummaryResponse:
    """Generate a PDF executive summary using Haiku."""
    from backend.application.services.ai_pdf_service import generate_pdf_summary

    api_key = settings.anthropic_api_key
    if not api_key:
        raise HTTPException(status_code=503, detail="ANTHROPIC_API_KEY no configurada.")

    payload = body.model_dump(exclude_none=True)

    try:
        parsed_result = await generate_pdf_summary(payload, api_key)
        return AiPdfSummaryResponse(**parsed_result)
    except Exception as e:
        _logger.error("Error generando PDF summary IA: %s", str(e))
        raise HTTPException(status_code=500, detail=f"Error interno IA: {str(e)}") from e
