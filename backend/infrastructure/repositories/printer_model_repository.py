"""Repository for printer models and their consumables. PostgreSQL only — no JSON fallback."""

from __future__ import annotations

import logging
from typing import List, Optional
from uuid import UUID

from backend.domain.entities import PrinterConsumable, PrinterModel
from backend.infrastructure.database import Database, DatabaseUnavailableError  # noqa: F401

_logger = logging.getLogger(__name__)


class PrinterModelRepository:
    def __init__(self, database: Database) -> None:
        self._db = database

    def list_models(self) -> List[PrinterModel]:
        """Return all printer models without consumables, ordered by model_code."""
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, model_name, model_code, family, ampv,
                           engine_life_pages, notes, created_at, updated_at
                    FROM printer_models
                    ORDER BY model_code
                    """
                )
                rows = cur.fetchall()
        return [_row_to_model(r) for r in rows]

    def get_by_id(self, model_id: UUID) -> Optional[PrinterModel]:
        """Return a single printer model by UUID, or None if not found."""
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, model_name, model_code, family, ampv,
                           engine_life_pages, notes, created_at, updated_at
                    FROM printer_models
                    WHERE id = %s
                    """,
                    (str(model_id),),
                )
                row = cur.fetchone()
        return _row_to_model(row) if row else None

    def get_with_consumables(
        self, model_id: UUID
    ) -> tuple[PrinterModel, List[PrinterConsumable]]:
        """Return a model with its full consumables list (including related_codes)."""
        with self._db.connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, model_name, model_code, family, ampv,
                           engine_life_pages, notes, created_at, updated_at
                    FROM printer_models
                    WHERE id = %s
                    """,
                    (str(model_id),),
                )
                model_row = cur.fetchone()
                if not model_row:
                    raise ValueError(f"Printer model {model_id} not found")

                cur.execute(
                    """
                    SELECT pc.id, pc.model_id, pc.part_number, pc.sku,
                           pc.description, pc.category, pc.life_pages,
                           pc.mttr_minutes, pc.voltage,
                           COALESCE(
                               array_agg(crc.code_pattern ORDER BY crc.code_pattern)
                               FILTER (WHERE crc.code_pattern IS NOT NULL),
                               '{}'
                           ) AS related_codes
                    FROM printer_consumables pc
                    LEFT JOIN consumable_related_codes crc ON crc.consumable_id = pc.id
                    WHERE pc.model_id = %s
                    GROUP BY pc.id, pc.model_id, pc.part_number, pc.sku,
                             pc.description, pc.category, pc.life_pages,
                             pc.mttr_minutes, pc.voltage
                    ORDER BY pc.part_number
                    """,
                    (str(model_id),),
                )
                consumable_rows = cur.fetchall()

        model = _row_to_model(model_row)
        consumables = [_row_to_consumable(r) for r in consumable_rows]
        return model, consumables

    def create_with_consumables(
        self, model_data: dict, consumables: List[dict]
    ) -> PrinterModel:
        """Insert a printer model with its consumables in a single transaction.

        Each dict in consumables may include a 'related_codes' key (list[str]).
        Raises psycopg2.errors.UniqueViolation if model_code/model_name already exists.
        Raises DatabaseUnavailableError if the DB cannot be reached.
        """
        with self._db.connect() as conn:
            try:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        INSERT INTO printer_models
                            (model_name, model_code, family, ampv, engine_life_pages, notes)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        RETURNING id, model_name, model_code, family, ampv,
                                  engine_life_pages, notes, created_at, updated_at
                        """,
                        (
                            model_data["model_name"],
                            model_data["model_code"],
                            model_data.get("family"),
                            model_data.get("ampv"),
                            model_data.get("engine_life_pages"),
                            model_data.get("notes"),
                        ),
                    )
                    model_row = cur.fetchone()
                    model_id = str(model_row[0])

                    for cons in consumables:
                        cur.execute(
                            """
                            INSERT INTO printer_consumables
                                (model_id, part_number, sku, description, category,
                                 life_pages, mttr_minutes, voltage)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                            RETURNING id
                            """,
                            (
                                model_id,
                                cons["part_number"],
                                cons.get("sku"),
                                cons["description"],
                                cons["category"],
                                cons.get("life_pages"),
                                cons.get("mttr_minutes"),
                                cons.get("voltage"),
                            ),
                        )
                        consumable_id = str(cur.fetchone()[0])

                        for code_pattern in cons.get("related_codes") or []:
                            cur.execute(
                                """
                                INSERT INTO consumable_related_codes (consumable_id, code_pattern)
                                VALUES (%s, %s)
                                ON CONFLICT (consumable_id, code_pattern) DO NOTHING
                                """,
                                (consumable_id, code_pattern),
                            )

                conn.commit()
                return _row_to_model(model_row)
            except Exception:
                conn.rollback()
                raise


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------


def _row_to_model(row: tuple) -> PrinterModel:
    return PrinterModel(
        id=row[0],
        model_name=row[1],
        model_code=row[2],
        family=row[3],
        ampv=row[4],
        engine_life_pages=row[5],
        notes=row[6],
        created_at=row[7],
        updated_at=row[8],
    )


def _row_to_consumable(row: tuple) -> PrinterConsumable:
    return PrinterConsumable(
        id=row[0],
        model_id=row[1],
        part_number=row[2],
        sku=row[3],
        description=row[4],
        category=row[5],
        life_pages=row[6],
        mttr_minutes=row[7],
        voltage=row[8],
        related_codes=list(row[9]) if row[9] else [],
    )
