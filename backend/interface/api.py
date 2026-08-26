"""FastAPI interface entry point. Orchestrates routers and global config."""

from __future__ import annotations

import logging

from backend.application.scheduler import start_scheduler, stop_scheduler
from backend.infrastructure.config import Settings, get_settings
from backend.infrastructure.database import Database
from backend.interface.exception_handlers import register_exception_handlers
from backend.interface.rate_limiter import limiter
from backend.interface.routers import (
    ai,
    analysis,
    cpmd,
    error_codes,
    fleet,
    maintenance,
    notifications,
    saved_analysis,
    sds,
)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

logging.basicConfig(level=logging.INFO, format="%(name)s %(levelname)s: %(message)s")


def get_app(settings: Settings | None = None) -> FastAPI:
    """Factory used for production and testing."""
    settings = settings or get_settings()

    app = FastAPI(
        title="HP Printer Logs Analyzer",
        version="0.2.0",
        description="Modularized API for HP printer log analysis.",
    )

    @app.on_event("startup")
    def startup_event():
        if settings.enable_scheduler:
            start_scheduler()
        # Resume any in-progress HP cache-refresh notifications orphaned by a restart.
        try:
            from backend.application.services.hp_cache_notifier import resume_pending_watches
            from backend.infrastructure.repositories.notification_repository import (
                NotificationRepository,
            )
            from backend.interface.deps import _db

            resume_pending_watches(get_settings(), NotificationRepository(_db))
        except Exception as exc:  # never block startup on this
            logging.getLogger(__name__).warning("Could not resume cache watches: %s", exc)

    @app.on_event("shutdown")
    def shutdown_event():
        if settings.enable_scheduler:
            stop_scheduler()

    # Dependency overrides for testing
    if settings:
        app.dependency_overrides[get_settings] = lambda: settings

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    register_exception_handlers(app)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "https://printer-logs-analyzer-alpha.vercel.app",
            "https://printer-logs-analyzer-git-develop-imartinez1.vercel.app",
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://localhost:5176",
            "http://localhost:8081",
            "http://127.0.0.1:8081",
            "http://192.168.178.2:5175",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
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

    app.include_router(error_codes.router)
    app.include_router(fleet.router)
    app.include_router(maintenance.router)
    app.include_router(notifications.router)
    app.include_router(cpmd.router)

    from pathlib import Path
    cpmd_dir = Path(__file__).parent.parent.parent / "data" / "cpmd"
    if cpmd_dir.exists():
        app.mount("/static/cpmd", StaticFiles(directory=str(cpmd_dir)), name="cpmd-static")

    return app


app = get_app()
