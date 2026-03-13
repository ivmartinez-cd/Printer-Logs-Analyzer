"""Application services orchestrating log ingestion and analysis."""

from __future__ import annotations

from collections import defaultdict
from datetime import timedelta
from fnmatch import fnmatch
from typing import Dict, Iterable, List

from application.config.runtime_config import ActiveConfig, RuntimeConfig
from domain.entities import AnalysisResult, Event, Incident
from infrastructure.config import Settings, get_settings
from infrastructure.json_config_validator import GlobalRuleModel, JsonConfigValidator
from infrastructure.repositories.config_repository import ConfigRepository

SEVERITY_SCORE = {"INFO": 1, "WARNING": 2, "ERROR": 3}


class AnalysisService:
    """Entry-point for applying analysis rules over parsed events."""

    def __init__(self, settings: Settings | None = None, runtime_config: RuntimeConfig | None = None) -> None:
        self.settings = settings or get_settings()
        self.runtime_config = runtime_config or RuntimeConfig(ConfigRepository(), JsonConfigValidator())

    def analyze(self, events: Iterable[Event]) -> AnalysisResult:
        """Run incident grouping and compute global severity."""
        self.runtime_config.force_reload()
        ordered = sorted(events, key=lambda evt: evt.timestamp)
        if not ordered:
            return AnalysisResult(incidents=[], global_severity="INFO", metadata={"events_considered": 0})

        active_config = self.runtime_config.get()
        print("[CONFIG] reglas cargadas:", [r.code for r in active_config.payload.global_rules])

        scoped_events = ordered

        rules_map = {rule.code: rule for rule in active_config.payload.global_rules}
        incidents = self._build_incidents(scoped_events, rules_map)
        global_severity = self._global_severity(incidents)

        return AnalysisResult(
            incidents=incidents,
            global_severity=global_severity,
            metadata={
                "events_considered": len(scoped_events),
                "config_version": active_config.version_number,
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

        # 3) Diagnóstico: agrupación por código
        print("[3] grouped.keys() =", list(grouped.keys()))
        for k in ["13.B9.A2", "13.20"]:
            if k in grouped:
                print("[3] len(bucket) para", repr(k), "=", len(grouped[k]))

        incidents: List[Incident] = []
        for code, bucket in grouped.items():
            rule = next(
                (r for r in rules_map.values() if fnmatch(code, r.code) and r.enabled),
                None,
            )
            # 4) Diagnóstico: match de regla
            print("[4] code =", repr(code), "-> rule =", rule.code if rule else None)
            if not rule:
                continue
            bucket.sort(key=lambda evt: evt.timestamp)
            incidents.extend(self._extract_incidents_for_code(code, bucket, rule))
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

        # 6) Diagnóstico: _extract_incidents_for_code
        print("[6] _extract_incidents_for_code code =", repr(code), "rule.X =", rule.X, "rule.Y =", rule.Y, "len(events) =", len(events))

        i = 0
        while i < len(events):
            base = events[i]
            window_events = [base]

            j = i + 1
            while j < len(events):
                candidate = events[j]

                if candidate.timestamp - base.timestamp > window_delta:
                    break

                if candidate.counter - base.counter > rule.counter_max_jump:
                    break

                window_events.append(candidate)
                j += 1

            print("[6] i =", i, "base.timestamp =", base.timestamp, "len(window_events) =", len(window_events), "timestamps =", [e.timestamp for e in window_events])
            if len(window_events) >= 1:
                incidents.append(self._build_incident(code, window_events, rule))
            i = j

        return incidents

    @staticmethod
    def _build_incident(code: str, events: List[Event], rule: GlobalRuleModel) -> Incident:
        start = events[0].timestamp
        end = events[-1].timestamp
        severity = max(
            (e.type.upper() for e in events),
            key=lambda s: SEVERITY_SCORE.get(s, 0),
        )
        if severity not in SEVERITY_SCORE:
            severity = "INFO"
        severity_weight = SEVERITY_SCORE[severity]

        return Incident(
            id=f"{code}-{start.isoformat()}",
            code=code,
            classification=rule.classification,
            severity=severity,
            severity_weight=severity_weight,
            occurrences=len(events),
            start_time=start,
            end_time=end,
            counter_range=(events[0].counter, events[-1].counter),
            events=events,
            sds_link=rule.sds_link,
        )

    @staticmethod
    def _global_severity(incidents: List[Incident]) -> str:
        if not incidents:
            return "INFO"
        return max(incidents, key=lambda inc: inc.severity_weight).severity
