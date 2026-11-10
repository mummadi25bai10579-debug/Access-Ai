import uuid
from typing import Dict, Any, Optional
from app.database.session import Base, HAS_SQLALCHEMY

if HAS_SQLALCHEMY:
    from sqlalchemy import Column, String, DateTime, ForeignKey, func, Text
    from sqlalchemy.dialects.postgresql import UUID

    class NotificationModel(Base):
        __tablename__ = "notifications"

        id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
        user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
        title = Column(String(255), nullable=False)
        body = Column(Text, nullable=False)
        notification_type = Column(String(50), default="info")
        action_url = Column(String(512), nullable=True)
        read_at = Column(DateTime(timezone=True), nullable=True)
        created_at = Column(DateTime(timezone=True), server_default=func.now())

        def to_dict(self) -> Dict[str, Any]:
            return {
                "id": str(self.id),
                "user_id": str(self.user_id),
                "title": self.title,
                "body": self.body,
                "notification_type": self.notification_type,
                "action_url": self.action_url or "",
                "read_at": self.read_at.isoformat() if self.read_at else None,
                "is_read": self.read_at is not None,
                "created_at": self.created_at.isoformat() if self.created_at else None,
            }
else:
    class NotificationModel:
        pass

