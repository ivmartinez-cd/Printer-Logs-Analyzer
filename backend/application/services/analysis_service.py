"""Application services orchestrating log ingestion and analysis."""

from __future__ import annotations

from collections import defaultdict
from typing import Iterable, List

from domain.entities import AnalysisResult, Event, Incident

SEVERITY_SCORE = {"INFO": 1, "WARNING": 2, "ERROR": 3}


class AnalysisService:
    """Entry-point for analyzing parsed events. Groups by code and builds one incident per code."""

    def __init__(self) -> None:
        pass

    def analyze(self, events: Iterable[Event]) -> AnalysisResult:
        """Group events by code, build one incident per code. No rules."""
        ordered = sorted(events, key=lambda evt: evt.timestamp)
        if not ordered:
            return AnalysisResult(incidents=[], global_severity="INFO", metadata={"events_considered": 0})

        by_code: dict[str, List[Event]] = defaultdict(list)
        for evt in ordered:
            by_code[evt.code].append(evt)

        incidents: List[Incident] = []
        for code, group in by_code.items():
            group_sorted = sorted(group, key=lambda e: e.timestamp)
            start_time = group_sorted[0].timestamp
            end_time = group_sorted[-1].timestamp
            severity = max(
                (e.type.upper() for e in group_sorted),
                key=lambda s: SEVERITY_SCORE.get(s, 0),
            )
            if severity not in SEVERITY_SCORE:
                severity = "INFO"
            severity_weight = SEVERITY_SCORE[severity]

            classification = code
            sds_link = None
            sds_solution_content = None
            for evt in group_sorted:
                if evt.code_description and evt.code_description.strip():
                    classification = evt.code_description.strip()
                    break
            for evt in group_sorted:
                if evt.code_solution_url and evt.code_solution_url.strip():
                    sds_link = evt.code_solution_url.strip()
                    sds_solution_content = getattr(evt, "code_solution_content", None)
                    break

            incidents.append(
                Incident(
                    id=f"{code}-{start_time.isoformat()}",
                    code=code,
                    classification=classification,
                    severity=severity,
                    severity_weight=severity_weight,
                    occurrences=len(group_sorted),
                    start_time=start_time,
                    end_time=end_time,
                    counter_range=(group_sorted[0].counter, group_sorted[-1].counter),
                    events=group_sorted,
                    sds_link=sds_link,
                    sds_solution_content=sds_solution_content,
                )
            )

        global_severity = max(
            (e.type.upper() for e in ordered),
            key=lambda s: SEVERITY_SCORE.get(s, 0),
        )
        if global_severity not in SEVERITY_SCORE:
            global_severity = "INFO"

        return AnalysisResult(
            incidents=incidents,
            global_severity=global_severity,
            metadata={"events_considered": len(ordered)},
        )
