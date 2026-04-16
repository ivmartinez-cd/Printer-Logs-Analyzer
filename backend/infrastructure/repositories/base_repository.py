import json
import logging
from abc import ABC, abstractmethod
from typing import Generic, TypeVar, Optional, List, Callable, Any
from uuid import UUID
from pathlib import Path

from backend.infrastructure.database import Database, DatabaseUnavailableError
from backend.domain.exceptions import ResourceNotFoundError

T = TypeVar('T')
ID_TYPE = TypeVar('ID_TYPE')

_logger = logging.getLogger(__name__)

class BaseRepository(ABC, Generic[T, ID_TYPE]):
    """
    Repositorio base genérico que implementa el patrón de fallback
    cuando la base de datos PostgreSQL/Neon no está disponible.
    """
    def __init__(self, database: Optional[Database] = None) -> None:
        self._db = database or Database()
        self.resource_name = self.__class__.__name__.replace('Repository', '')

    def _execute_with_fallback(self, db_func: Callable[..., Any], local_func: Callable[..., Any], *args: Any, **kwargs: Any) -> Any:
        try:
            if not self._db:
                raise DatabaseUnavailableError("No Database provided")
            return db_func(*args, **kwargs)
        except DatabaseUnavailableError:
            return local_func(*args, **kwargs)

    def get_or_404(self, get_func: Callable[..., Optional[T]], resource_id: Any, *args: Any, **kwargs: Any) -> T:
        """Intenta obtener un recurso y si no lo encuentra, lanza ResourceNotFoundError de la Fase 2."""
        result = get_func(*args, **kwargs)
        if not result:
            raise ResourceNotFoundError(self.resource_name, str(resource_id))
        return result

    # Interfaz común de CRUD que los repositorios deben implementar (o usar fallbacks manuales):
    
    def get_by_id(self, entity_id: ID_TYPE) -> Optional[T]:
        """Obtiene una entidad por su ID principal."""
        return self._execute_with_fallback(
            self._get_by_id_db,
            self._get_by_id_local,
            entity_id
        )

    def get_all(self) -> List[T]:
        """Obtiene todas las entidades."""
        return self._execute_with_fallback(
            self._get_all_db,
            self._get_all_local
        )

    def delete(self, entity_id: ID_TYPE) -> int:
        """Elimina una entidad por ID, devuelve la cantidad de registros borrados."""
        return self._execute_with_fallback(
            self._delete_db,
            self._delete_local,
            entity_id
        )

    # Métodos a implementar por los repositorios concretos

    def _get_by_id_db(self, entity_id: ID_TYPE) -> Optional[T]:
        raise NotImplementedError

    def _get_by_id_local(self, entity_id: ID_TYPE) -> Optional[T]:
        raise NotImplementedError

    def _get_all_db(self) -> List[T]:
        raise NotImplementedError

    def _get_all_local(self) -> List[T]:
        raise NotImplementedError

    def _delete_db(self, entity_id: ID_TYPE) -> int:
        raise NotImplementedError

    def _delete_local(self, entity_id: ID_TYPE) -> int:
        raise NotImplementedError

    # Operaciones comunes de DB
    def _load_json_file(self, filepath: Path) -> list:
        if not filepath.exists():
            _logger.warning("[%s] Local file %s not found", self.__class__.__name__, filepath)
            return []
        try:
            with open(filepath, encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            _logger.error("[%s] Failed to read local JSON: %s", self.__class__.__name__, e)
            return []
