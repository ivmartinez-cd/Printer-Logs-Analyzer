"""Background watcher that turns an async HP cache refresh into a notification.

After a cache refresh is requested, HP processes it for a few minutes. This runs
in a daemon thread, polling the device's HP Smart operations table until the cache
operations reach a terminal state, then updates the notification with the result.
"""

from __future__ import annotations

import logging
import threading
import time
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

_POLL_INTERVAL_S = 20
_MAX_WAIT_S = 240  # ~4 minutes


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
        except Exception as exc:  # transient portal/session error: keep polling
            _logger.debug("HP operations poll failed for %s: %s", serial, exc)
            continue

        cache_ops = [o for o in ops if o.get("operation") in CACHE_OP_TYPES]
        if not cache_ops:
            continue
        # Prefer ops whose "sent" changed vs baseline (our new run).
        fresh = [o for o in cache_ops if o.get("sent", "") != baseline.get(o["operation"], "")]
        target = fresh or cache_ops
        if all(_is_terminal(o.get("last_known_state")) for o in target):
            status, message = _summarize(target)
            repo.update_status(
                notification_id, status=status, title=f"Caché de HP — {serial}", message=message
            )
            _logger.info("HP cache refresh finished for %s: %s", serial, status)
            return

    repo.update_status(
        notification_id,
        status="warning",
        title=f"Caché de HP — {serial}",
        message=(
            "La actualización de la caché de HP sigue procesándose. "
            "Volvé a consultar el estado en unos minutos."
        ),
    )


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
