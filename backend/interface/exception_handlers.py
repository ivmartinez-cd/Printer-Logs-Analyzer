import logging
import asyncio
from fastapi import Request, FastAPI
from fastapi.responses import JSONResponse
from backend.domain.exceptions import DomainError, ResourceNotFoundError, ExternalServiceError
from backend.application.services.insight_service import InsightAPIError
from backend.application.services.sds_web_service import SDSWebError
try:
    import anthropic
except ImportError:
    anthropic = None
from starlette.exceptions import HTTPException as StarletteHTTPException

_logger = logging.getLogger(__name__)

def register_exception_handlers(app: FastAPI):
    
    @app.exception_handler(DomainError)
    @app.exception_handler(InsightAPIError)
    @app.exception_handler(SDSWebError)
    async def domain_error_handler(request: Request, exc: Exception):
        status_code = 400
        code = "DOMAIN_ERROR"
        detail = str(exc)
        
        if isinstance(exc, DomainError):
            code = exc.code
            detail = exc.message
            if isinstance(exc, ResourceNotFoundError):
                status_code = 404
            elif isinstance(exc, ExternalServiceError):
                status_code = 502
        elif isinstance(exc, (InsightAPIError, SDSWebError)):
            status_code = 502
            code = "EXTERNAL_SERVICE_ERROR"
            
        return JSONResponse(
            status_code=status_code,
            content={
                "error": True,
                "code": code,
                "detail": detail
            }
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": True,
                "code": f"HTTP_{exc.status_code}",
                "detail": exc.detail
            }
        )

    @app.exception_handler(ValueError)
    async def value_error_handler(request: Request, exc: ValueError):
        # We handle ValueError as 400 or 422 depending on context
        # But to satisfy the tests and general expectations:
        status_code = 400
        detail = str(exc)
        if "JSON" in detail or "extraído" in detail.lower():
            status_code = 422
            
        return JSONResponse(
            status_code=status_code,
            content={
                "error": True,
                "code": "VALUE_ERROR",
                "detail": detail
            }
        )

    @app.exception_handler(asyncio.TimeoutError)
    @app.exception_handler(TimeoutError)
    async def timeout_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=504,
            content={
                "error": True,
                "code": "GATEWAY_TIMEOUT",
                "detail": "La operación tardó demasiado tiempo en responder (Timeout)."
            }
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        if anthropic and isinstance(exc, (anthropic.APIError, anthropic.AuthenticationError, anthropic.RateLimitError)):
            status_code = 502
            code = "AI_SERVICE_ERROR"
            detail = f"Error en el servicio de IA: {str(exc)}"
            if isinstance(exc, anthropic.AuthenticationError):
                detail = "API Key de Anthropic inválida o expirada."
            elif isinstance(exc, anthropic.RateLimitError):
                status_code = 429
                detail = "Se ha alcanzado el límite de velocidad de Anthropic."
            return JSONResponse(status_code=status_code, content={"error": True, "code": code, "detail": detail})

        _logger.exception("Unexpected error: %s", exc)
        return JSONResponse(
            status_code=500,
            content={
                "error": True,
                "code": "INTERNAL_SERVER_ERROR",
                "detail": "Ha ocurrido un error inesperado en el servidor."
            }
        )
