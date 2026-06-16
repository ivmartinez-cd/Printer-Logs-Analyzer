from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class NotificationItem(BaseModel):
    """One in-app notification."""

    id: str
    type: str
    title: str
    message: str
    status: str
    device_serial: Optional[str] = None
    is_read: bool
    created_at: str
    updated_at: str


class NotificationsResponse(BaseModel):
    """Response of GET /notifications."""

    notifications: List[NotificationItem] = Field(default_factory=list)
    unread_count: int = 0
