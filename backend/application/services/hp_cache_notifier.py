"""Background watcher that turns an async HP cache refresh into a notification.

After a cache refresh is requested, HP processes it for a few minutes. This runs
in a daemon thread, polling the device's HP Smart operations table until the cache
operations reach a terminal state, then updates the notification with the result.
"""

from __future__ import annotations

import logging
import threading
import time
from datetime import datetime, timezone
from typing import Dict, List
from uuid import UUID

from backend.application.services.sds_web_service import CACHE_OP_TYPES, get_session
from backend.infrastructure.config import Settings
from backend.infrastructure.repositories.notification_repository import NotificationRepository

_logger = logging.getLogger(__name__)

# Friendly names for the cache operations shown to the user.
_OP_LABELS = {
    "RefreshHPCloudDeviceActionCache": "Acciones",
    "RefreshHPCloudDeviceEventLogCache": "Logs de eventos",
    "RefreshHPCloudDeviceConfigCache": "Configuración",
}

_TERMINAL_STATES = {
    "success",
    "partialsuccess",
    "finishedwitherrors",
    "httpcredentialsneeded",
    "failed",
    "error",
    "timedout",
    "cancelled",
}

_POLL_INTERVAL_S = 30
_MAX_WAIT_S = 900  # ~15 minutes (HP can take ~10 min to finish a cache refresh)


def _norm(state: str | None) -> str:
    return (state or "").replace(" ", "").lower()


def _is_terminal(state: str | None) -> bool:
    return _norm(state) in _TERMINAL_STATES


def _emoji(state: str | None) -> str:
    s = _norm(state)
    if s == "success":
        return "✅"
    if s == "partialsuccess":
        return "⚠️"
    return "❌"


def _summarize(ops: List[dict]) -> tuple[str, str]:
    """Return (status, message) for the finished cache operations."""
    parts = []
    all_ok = True
    for op in ops:
        label = _OP_LABELS.get(op["operation"], op["operation"])
        state = op.get("last_known_state")
        parts.append(f"{label} {_emoji(state)}")
        if _norm(state) != "success":
            all_ok = False
    summary = " · ".join(parts)
    if all_ok:
        return "success", f"Caché de HP actualizada — {summary}"
    return "warning", f"Caché de HP procesada con avisos — {summary}"


def _watch(
    settings: Settings,
    repo: NotificationRepository,
    notification_id: UUID,
    device_id: str,
    serial: str,
    baseline: Dict[str, str],
) -> None:
    session = get_session(settings)
    deadline = time.monotonic() + _MAX_WAIT_S
    while time.monotonic() < deadline:
        time.sleep(_POLL_INTERVAL_S)
        try:
            ops = session.get_hp_operations(device_id)
            _logger.info(
                "HP ops poll for %s — %d rows total: %s",
                serial,
                len(ops),
                [(o.get("operation"), o.get("last_known_state")) for o in ops],
            )

            # The table lists every past run; keep only the newest row per cache op
            # type (the table is ordered newest-first) to avoid stale/duplicate rows.
            latest_by_op: dict[str, dict] = {}
            for o in ops:
                op = o.get("operation")
                if op in CACHE_OP_TYPES and op not in latest_by_op:
                    latest_by_op[op] = o
            cache_ops = list(latest_by_op.values())
            if not cache_ops:
                _logger.info(
                    "HP ops poll for %s — no cache ops found in %d rows (CACHE_OP_TYPES=%s)",
                    serial,
                    len(ops),
                    CACHE_OP_TYPES,
                )
                continue
            # Prefer ops whose "sent" changed vs baseline (our new run).
            fresh = [o for o in cache_ops if o.get("sent", "") != baseline.get(o["operation"], "")]
            target = fresh or cache_ops
            _logger.info(
                "HP ops poll for %s — target: %s",
                serial,
                [(o.get("operation"), o.get("last_known_state"), o.get("sent")) for o in target],
            )
            if all(_is_terminal(o.get("last_known_state")) for o in target):
                status, message = _summarize(target)
                repo.update_status(
                    notification_id, status=status, title=f"Caché de HP — {serial}", message=message
                )
                _logger.info("HP cache refresh finished for %s: %s", serial, status)
                return
        except Exception as exc:
            _logger.warning("HP cache watch error for %s: %s", serial, exc)
            continue

    try:
        repo.update_status(
            notification_id,
            status="warning",
            title=f"Caché de HP — {serial}",
            message=(
                "La actualización de la caché de HP sigue procesándose. "
                "Volvé a consultar el estado en unos minutos."
            ),
        )
    except Exception as exc:
        _logger.error("Failed to update notification %s after timeout: %s", notification_id, exc)


def start_cache_refresh_watch(
    settings: Settings,
    repo: NotificationRepository,
    notification_id: UUID,
    device_id: str,
    serial: str,
    baseline: Dict[str, str],
) -> None:
    """Spawn a daemon thread that updates the notification when the refresh ends."""
    thread = threading.Thread(
        target=_watch,
        args=(settings, repo, notification_id, device_id, serial, baseline),
        name=f"hp-cache-watch-{serial}",
        daemon=True,
    )
    thread.start()


def resume_pending_watches(settings: Settings, repo: NotificationRepository) -> None:
    """Re-attach watchers to recent in-progress cache notifications.

    A backend restart (e.g. a deploy) kills the watcher threads, leaving their
    notifications stuck "in_progress". On startup we resume watching the recent
    ones so they still get resolved.
    """

    def _run() -> None:
        from backend.application.services.insight_service import get_device_info

        if not (
            settings.insight_portal_url and settings.insight_api_key and settings.insight_api_secret
        ):
            return
        try:
            notifs = repo.list(limit=100)
        except Exception as exc:
            _logger.warning("Could not list notifications to resume watches: %s", exc)
            return

        now = datetime.now(timezone.utc)
        for n in notifs:
            if n.type != "hp_cache_refresh" or n.status != "in_progress" or not n.device_serial:
                continue
            created = n.created_at if n.created_at.tzinfo else n.created_at.replace(tzinfo=timezone.utc)
            if (now - created).total_seconds() > 2 * 3600:  # skip ancient stuck ones
                continue
            try:
                info = get_device_info(
                    settings.insight_portal_url,
                    settings.insight_api_key,
                    settings.insight_api_secret,
                    n.device_serial,
                )
                device_id = str(info["device_id"]) if info.get("device_id") else None
            except Exception:
                device_id = None
            if not device_id:
                continue
            _logger.info("Resuming HP cache watch for notification %s (%s)", n.id, n.device_serial)
            start_cache_refresh_watch(settings, repo, n.id, device_id, n.device_serial, baseline={})

    threading.Thread(target=_run, name="hp-cache-resume", daemon=True).start()
