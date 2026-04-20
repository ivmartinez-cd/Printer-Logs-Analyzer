from datetime import datetime
from uuid import uuid4

import pytest
from backend.infrastructure.repositories.saved_analysis_repository import (
    SavedAnalysisRepository,
    SavedAnalysisSnapshot,
)


def test_row_to_snapshot_mapping():
    repo = SavedAnalysisRepository.__new__(SavedAnalysisRepository)

    # Mock row as returned by PostgreSQL
    # Columns: id, name, equipment_identifier, incidents, global_severity, created_at, ai_diagnosis
    test_id = uuid4()
    test_at = datetime.now()
    row = (
        test_id,  # 0
        "Test Analysis",  # 1
        "SN123456",  # 2
        [{"code": "E1"}],  # 3
        "WARNING",  # 4
        test_at,  # 5
        "Some AI Diagnosis",  # 6
    )

    snapshot = repo._row_to_snapshot(row)

    assert snapshot.id == test_id
    assert snapshot.name == "Test Analysis"
    assert snapshot.equipment_identifier == "SN123456"
    assert snapshot.incidents == [{"code": "E1"}]
    assert snapshot.global_severity == "WARNING"
    assert snapshot.created_at == test_at
    assert snapshot.ai_diagnosis == "Some AI Diagnosis"


if __name__ == "__main__":
    test_row_to_snapshot_mapping()
    print("Test passed!")
