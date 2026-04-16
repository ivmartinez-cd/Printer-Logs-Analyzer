from backend.application.parsers.log_parser import LogParser
from backend.application.services.analysis_service import AnalysisService
from backend.infrastructure.config import get_settings
from backend.infrastructure.database import Database
from backend.infrastructure.repositories.error_code_repository import ErrorCodeRepository
from backend.infrastructure.repositories.error_solution_repository import ErrorSolutionRepository
from backend.infrastructure.repositories.printer_model_repository import PrinterModelRepository
from backend.infrastructure.repositories.saved_analysis_repository import SavedAnalysisRepository
from fastapi import Depends

__all__ = [
    "get_db",
    "get_error_code_repo",
    "get_printer_model_repo",
    "get_saved_analysis_repo",
    "get_error_solution_repo",
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


def get_printer_model_repo(db: Database = Depends(get_db)) -> PrinterModelRepository:
    return PrinterModelRepository(db)


def get_saved_analysis_repo(db: Database = Depends(get_db)) -> SavedAnalysisRepository:
    return SavedAnalysisRepository(db)


def get_error_solution_repo(db: Database = Depends(get_db)) -> ErrorSolutionRepository:
    return ErrorSolutionRepository(db)


def get_log_parser() -> LogParser:
    return LogParser()


def get_analysis_service() -> AnalysisService:
    return AnalysisService()
