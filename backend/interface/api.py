"""FastAPI interface entry point. Orchestrates routers and global config."""

from __future__ import annotations
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from backend.infrastructure.config import Settings, get_settings
from backend.interface.rate_limiter import limiter
from backend.interface.exception_handlers import register_exception_handlers
from backend.infrastructure.database import Database
from backend.interface.routers import (
    analysis,
    sds,
    ai,
    saved_analysis,
    printers,
    error_codes
)

logging.basicConfig(level=logging.INFO, format="%(name)s %(levelname)s: %(message)s")

def get_app(settings: Settings | None = None) -> FastAPI:
    """Factory used for production and testing."""
    settings = settings or get_settings()
    
    app = FastAPI(
        title="HP Printer Logs Analyzer",
        version="0.2.0",
        description="Modularized API for HP printer log analysis.",
    )
    
    # Dependency overrides for testing
    if settings:
        app.dependency_overrides[get_settings] = lambda: settings
        
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    register_exception_handlers(app)
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "https://printer-logs-analyzer.vercel.app",
            "http://localhost:5173",
            "http://localhost:5174",
        ],
        allow_credentials=True,
        allow_methods=["GET", "POST", "DELETE"],
        allow_headers=["Content-Type", "x-api-key"],
    )

    # Global routes
    @app.get("/health", tags=["System"])
    def health() -> dict:
        db = Database()
        db_ok = db.is_available()
        return {
            "status": "ok",
            "db_mode": "postgres" if db_ok else "local_fallback",
            "db_available": db_ok,
        }

    # Include modular routers
    app.include_router(analysis.router)
    app.include_router(sds.router)
    app.include_router(ai.router)
    app.include_router(saved_analysis.router)
    app.include_router(printers.router)
    app.include_router(error_codes.router)

    return app

app = get_app()
