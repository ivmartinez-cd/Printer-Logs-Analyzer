import logging
from typing import Any, Dict

from backend.infrastructure.config import Settings
from backend.interface.auth import authenticate
from backend.interface.deps import get_settings
from backend.interface.rate_limiter import limiter
from backend.interface.schemas.ai import AiDiagnoseRequest, AiDiagnoseResponse
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
@limiter.limit("5/minute")
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

    # Claude exceptions are handled by global handler or let them bubble up
    # However, to map Anthropic specific errors to nice messages, I could do it here or in the global handler.
    # I'll let them bubble up for now or just simplify.

    diagnosis, tokens = await call_claude(payload, api_key)
    cost = compute_cost(tokens)

    return AiDiagnoseResponse(
        diagnosis=diagnosis,
        model=MODEL,
        tokens_used=tokens,
        cost_usd=cost,
    )
