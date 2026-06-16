from uuid import UUID

from backend.infrastructure.repositories.notification_repository import NotificationRepository
from backend.interface.auth import authenticate
from backend.interface.deps import get_notification_repo
from backend.interface.schemas.notification import NotificationItem, NotificationsResponse
from fastapi import APIRouter, Depends, HTTPException

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def _to_item(n) -> NotificationItem:
    return NotificationItem(
        id=str(n.id),
        type=n.type,
        title=n.title,
        message=n.message,
        status=n.status,
        device_serial=n.device_serial,
        is_read=n.is_read,
        created_at=n.created_at.isoformat(),
        updated_at=n.updated_at.isoformat(),
    )


@router.get(
    "",
    dependencies=[Depends(authenticate)],
    summary="List recent notifications",
    response_description="Recent notifications and the unread count.",
)
def list_notifications(
    limit: int = 50,
    repo: NotificationRepository = Depends(get_notification_repo),
) -> NotificationsResponse:
    items = repo.list(limit=limit)
    return NotificationsResponse(
        notifications=[_to_item(n) for n in items],
        unread_count=sum(1 for n in items if not n.is_read),
    )


@router.post(
    "/{id}/read",
    status_code=204,
    dependencies=[Depends(authenticate)],
    summary="Mark a notification as read",
)
def mark_notification_read(
    id: str, repo: NotificationRepository = Depends(get_notification_repo)
) -> None:
    try:
        uid = UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid id") from None
    if not repo.mark_read(uid):
        raise HTTPException(status_code=404, detail="Notification not found")


@router.post(
    "/read-all",
    dependencies=[Depends(authenticate)],
    summary="Mark all notifications as read",
)
def mark_all_notifications_read(
    repo: NotificationRepository = Depends(get_notification_repo),
) -> dict:
    return {"updated": repo.mark_all_read()}
