import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from backend.interface.schemas.ai import AiDiagnoseRequest, AiDiagnoseResponse
from backend.interface.deps import get_settings
from backend.interface.auth import authenticate
from backend.interface.rate_limiter import limiter
from backend.infrastructure.config import Settings
from typing import Dict, Any

router = APIRouter(prefix="/analysis", tags=["AI Diagnosis"])
_logger = logging.getLogger(__name__)

@router.post("/ai-diagnose", response_model=AiDiagnoseResponse, dependencies=[Depends(authenticate)])
@limiter.limit("5/minute")
async def ai_diagnose(
    request: Request,
    body: AiDiagnoseRequest,
    settings: Settings = Depends(get_settings)
) -> AiDiagnoseResponse:
    """Generate a technical diagnosis using Anthropic Claude."""
    import anthropic as _anthropic
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

    try:
        diagnosis, tokens = await call_claude(payload, api_key)
    except _anthropic.AuthenticationError as exc:
        raise HTTPException(status_code=503, detail="API key de Anthropic inválida.") from exc
    except _anthropic.RateLimitError as exc:
        raise HTTPException(status_code=429, detail="Rate limit de Anthropic alcanzado.") from exc
    except Exception as exc:
        _logger.error("[ai-diagnose] Error: %s", exc)
        raise HTTPException(status_code=503, detail="Error en el servicio de Anthropic.") from exc

    cost = compute_cost(tokens)
    return AiDiagnoseResponse(
        diagnosis=diagnosis,
        model=MODEL,
        tokens_used=tokens,
        cost_usd=cost,
    )
