"""Application services orchestrating log ingestion and analysis."""

from __future__ import annotations

from collections import defaultdict
from datetime import timedelta
from typing import Dict, Iterable, List

from application.config.runtime_config import ActiveConfig, RuntimeConfig
from domain.entities import AnalysisResult, Event, Incident
from infrastructure.config import Settings, get_settings
from infrastructure.json_config_validator import GlobalRuleModel, JsonConfigValidator
from infrastructure.repositories.config_repository import ConfigRepository


class AnalysisService:
    """Entry-point for applying analysis rules over parsed events."""

    def __init__(self, settings: Settings | None = None, runtime_config: RuntimeConfig | None = None) -> None:
        self.settings = settings or get_settings()
        self.runtime_config = runtime_config or RuntimeConfig(ConfigRepository(), JsonConfigValidator())

    def analyze(self, events: Iterable[Event]) -> AnalysisResult:
        """Run incident grouping and compute global severity."""
        ordered = sorted(events, key=lambda evt: evt.timestamp)
        if not ordered:
            return AnalysisResult(incidents=[], global_severity="INFO", metadata={"events_considered": 0})

        active_config = self.runtime_config.get()
        recency_window_seconds = self._recency_window_seconds(active_config)
        window_start = ordered[-1].timestamp - timedelta(seconds=recency_window_seconds)
        scoped_events = [evt for evt in ordered if evt.timestamp >= window_start]

        rules_map = {rule.code: rule for rule in active_config.payload.global_rules}
        incidents = self._build_incidents(scoped_events, rules_map)
        global_severity = self._global_severity(incidents)

        return AnalysisResult(
            incidents=incidents,
            global_severity=global_severity,
            metadata={
                "events_considered": len(scoped_events),
                "config_version": active_config.version_number,
                "recency_window_seconds": recency_window_seconds,
            },
        )

    def _recency_window_seconds(self, active_config: ActiveConfig) -> int:
        value = active_config.payload.defaults.get("recency_window")
        if isinstance(value, int) and value > 0:
            return value
        return self.settings.recency_window

    def _build_incidents(self, events: List[Event], rules_map: Dict[str, GlobalRuleModel]) -> List[Incident]:
        if not events:
            return []

        grouped: Dict[str, List[Event]] = defaultdict(list)
        for event in events:
            grouped[event.code].append(event)

        incidents: List[Incident] = []
        for code, bucket in grouped.items():
            rule = rules_map.get(code)
            if not rule or not rule.enabled:
                continue
            bucket.sort(key=lambda evt: evt.timestamp)
            trimmed = self._apply_rule_window(bucket, rule.recency_window)
            if not trimmed:
                continue
            incidents.extend(self._extract_incidents_for_code(code, trimmed, rule))
        return incidents

    @staticmethod
    def _apply_rule_window(events: List[Event], window_seconds: int) -> List[Event]:
        if not events or window_seconds <= 0:
            return events
        end = events[-1].timestamp
        start = end - timedelta(seconds=window_seconds)
        return [evt for evt in events if evt.timestamp >= start]

    def _extract_incidents_for_code(self, code: str, events: List[Event], rule: GlobalRuleModel) -> List[Incident]:
        incidents: List[Incident] = []
        window_delta = timedelta(minutes=rule.Y)
        start_index = 0

        while start_index < len(events):
            window_events = [events[start_index]]
            idx = start_index + 1
            while idx < len(events):
                candidate = events[idx]
                if candidate.timestamp - window_events[0].timestamp > window_delta:
                    break
                if candidate.counter <= window_events[-1].counter:
                    break
                if candidate.counter - window_events[0].counter > rule.counter_max_jump:
                    break
                window_events.append(candidate)
                idx += 1

            if len(window_events) >= rule.X:
                incidents.append(self._build_incident(code, window_events, rule))
                start_index = idx
            else:
                start_index += 1

        return incidents

    @staticmethod
    def _build_incident(code: str, events: List[Event], rule: GlobalRuleModel) -> Incident:
        start = events[0].timestamp
        end = events[-1].timestamp

        return Incident(
            id=f"{code}-{start.isoformat()}",
            code=code,
            classification=rule.classification,
            severity_weight=rule.severity_weight,
            occurrences=len(events),
            start_time=start,
            end_time=end,
            counter_range=(events[0].counter, events[-1].counter),
            events=events,
        )

    @staticmethod
    def _global_severity(incidents: List[Incident]) -> str:
        if not incidents:
            return "INFO"
        return max(incidents, key=lambda inc: inc.severity_weight).classification
