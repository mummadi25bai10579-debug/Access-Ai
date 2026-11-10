from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import uuid
from app.api.deps import get_current_user
from app.database.session import get_db
from app.database.models.notification import NotificationModel
from app.database.models.profile import ProfileModel

from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter()

def _resolve_profile_id(db: Session, user_id: str) -> Optional[uuid.UUID]:
    try:
        return uuid.UUID(str(user_id))
    except ValueError:
        pass
    try:
        prof = db.query(ProfileModel).filter(ProfileModel.clerk_user_id == user_id).first()
        return prof.id if prof else None
    except Exception as e:
        logger.warning(f"Failed to resolve profile id: {e}")
        return None

@router.get("")
async def list_notifications(
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        prof_id = _resolve_profile_id(db, user["clerk_user_id"])
        if not prof_id:
            return {"success": True, "data": [], "request_id": getattr(request.state, "request_id", "req-id")}

        notifications = (
            db.query(NotificationModel)
            .filter(NotificationModel.user_id == prof_id)
            .order_by(NotificationModel.created_at.desc())
            .all()
        )
        return {
            "success": True,
            "data": [n.to_dict() for n in notifications],
            "request_id": getattr(request.state, "request_id", "req-id"),
        }
    except Exception as e:
        logger.warning(f"Failed to list notifications: {e}")
        return {"success": True, "data": [], "request_id": getattr(request.state, "request_id", "req-id")}

class MarkReadRequest(BaseModel):
    is_read: bool = True

@router.patch("/{notification_id}/read")
async def mark_as_read(
    notification_id: str,
    request: Request,
    body: Optional[MarkReadRequest] = None,
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prof_id = _resolve_profile_id(db, user["clerk_user_id"])
    nid = uuid.UUID(str(notification_id))
    notif = (
        db.query(NotificationModel)
        .filter(NotificationModel.id == nid, NotificationModel.user_id == prof_id)
        .first()
    )
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    if body and not body.is_read:
        notif.read_at = None
    else:
        notif.read_at = datetime.now(timezone.utc)
    db.commit()
    return {
        "success": True,
        "data": notif.to_dict(),
        "request_id": getattr(request.state, "request_id", "req-id"),
    }

@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prof_id = _resolve_profile_id(db, user["clerk_user_id"])
    nid = uuid.UUID(str(notification_id))
    notif = (
        db.query(NotificationModel)
        .filter(NotificationModel.id == nid, NotificationModel.user_id == prof_id)
        .first()
    )
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(notif)
    db.commit()
    return {
        "success": True,
        "data": {"deleted": True},
        "request_id": getattr(request.state, "request_id", "req-id"),
    }

