from backend.application.parsers.log_parser import LogParser
from backend.application.services.analysis_service import AnalysisService
from backend.infrastructure.config import get_settings
from backend.infrastructure.database import Database
from backend.infrastructure.repositories.error_code_repository import ErrorCodeRepository
from backend.infrastructure.repositories.maintenance_repository import MaintenanceRepository
from backend.infrastructure.repositories.notification_repository import NotificationRepository
from backend.infrastructure.repositories.saved_analysis_repository import SavedAnalysisRepository
from backend.infrastructure.repositories.telemetry_repository import TelemetryRepository
from fastapi import Depends

__all__ = [
    "get_db",
    "get_error_code_repo",
    "get_saved_analysis_repo",
    "get_telemetry_repo",
    "get_maintenance_repo",
    "get_notification_repo",
    "get_log_parser",
    "get_analysis_service",
    "get_settings",
]

# Shared database instance (could be singleton or pool)
_db = Database()


def get_db() -> Database:
    return _db


def get_error_code_repo(db: Database = Depends(get_db)) -> ErrorCodeRepository:
    return ErrorCodeRepository(db)


def get_saved_analysis_repo(db: Database = Depends(get_db)) -> SavedAnalysisRepository:
    return SavedAnalysisRepository(db)


def get_telemetry_repo(db: Database = Depends(get_db)) -> TelemetryRepository:
    return TelemetryRepository(db)


def get_maintenance_repo(db: Database = Depends(get_db)) -> MaintenanceRepository:
    return MaintenanceRepository(db)


def get_notification_repo(db: Database = Depends(get_db)) -> NotificationRepository:
    return NotificationRepository(db)


def get_log_parser() -> LogParser:
    return LogParser()


def get_analysis_service() -> AnalysisService:
    return AnalysisService()
