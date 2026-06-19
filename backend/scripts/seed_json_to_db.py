"""Script to seed local JSON catalog and CPMD solutions into the PostgreSQL database."""

import json
import logging
import sys
from pathlib import Path

from backend.domain.entities import ErrorSolution, ErrorSolutionFru
from backend.infrastructure.database import Database
from backend.infrastructure.repositories.error_code_repository import ErrorCodeRepository
from backend.infrastructure.repositories.error_solution_repository import ErrorSolutionRepository

logging.basicConfig(level=logging.INFO, format="%(name)s %(levelname)s: %(message)s", stream=sys.stdout)
logger = logging.getLogger(__name__)


def seed_database():
    db = Database()
    try:
        # Check connection
        with db.connect():
            pass
    except Exception as e:
        logger.error(f"Cannot connect to database: {e}. Seeding aborted.")
        return

    # 1. Seed Error Codes
    error_codes_path = Path("data/error_codes_local.json")
    if not error_codes_path.exists():
        error_codes_path = Path("backend/infrastructure/fallback/error_codes_seed.json")

    if error_codes_path.exists():
        logger.info(f"Seeding error codes from {error_codes_path}...")
        try:
            with open(error_codes_path, encoding="utf-8") as f:
                codes_data = json.load(f)

            repo = ErrorCodeRepository(db)
            count = 0
            for code_key, val in codes_data.items():
                repo.upsert(
                    code=val.get("code") or code_key,
                    severity=val.get("severity"),
                    description=val.get("description"),
                    solution_url=val.get("solution_url"),
                    solution_content=val.get("solution_content"),
                )
                count += 1
            logger.info(f"Successfully seeded {count} error codes.")
        except Exception as e:
            logger.error(f"Failed to seed error codes: {e}")
    else:
        logger.warning("No error codes JSON file found to seed.")

    # 2. Seed CPMD Error Solutions
    solutions_path = Path("data/error_solutions.json")
    if solutions_path.exists():
        logger.info(f"Seeding CPMD error solutions from {solutions_path}...")
        try:
            with open(solutions_path, encoding="utf-8") as f:
                sols_data = json.load(f)

            repo = ErrorSolutionRepository(db)
            solutions = []
            for item in sols_data:
                frus = [ErrorSolutionFru(**fru) for fru in item.get("frus", [])]
                sol = ErrorSolution(
                    id=None,
                    model_family=item["model_family"],
                    code=item["code"],
                    title=item.get("title"),
                    cause=item.get("cause"),
                    technician_steps=item.get("technician_steps", []),
                    frus=frus,
                    source_audience=item.get("source_audience"),
                    source_page=item.get("source_page"),
                    cpmd_hash=item.get("cpmd_hash"),
                )
                solutions.append(sol)

            affected = repo.upsert_batch(solutions)
            logger.info(f"Successfully seeded {affected} CPMD solutions.")
        except Exception as e:
            logger.error(f"Failed to seed CPMD solutions: {e}")
    else:
        logger.warning("No error_solutions.json file found to seed.")


if __name__ == "__main__":
    seed_database()
