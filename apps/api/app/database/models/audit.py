import uuid
from typing import Dict, Any, Optional
from app.database.session import Base, HAS_SQLALCHEMY

if HAS_SQLALCHEMY:
    from sqlalchemy import Column, String, DateTime, JSON, ForeignKey, func, Text
    from sqlalchemy.dialects.postgresql import UUID

    class AuditEventModel(Base):
        __tablename__ = "audit_events"

        id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
        user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=True, index=True)
        event_type = Column(String(100), nullable=False)
        resource_type = Column(String(100), nullable=True)
        resource_id = Column(UUID(as_uuid=True), nullable=True)
        metadata_ = Column("metadata", JSON, default=dict)
        created_at = Column(DateTime(timezone=True), server_default=func.now())

        def to_dict(self) -> Dict[str, Any]:
            return {
                "id": str(self.id),
                "user_id": str(self.user_id) if self.user_id else None,
                "event_type": self.event_type,
                "resource_type": self.resource_type,
                "resource_id": str(self.resource_id) if self.resource_id else None,
                "metadata": self.metadata_ or {},
                "created_at": self.created_at.isoformat() if self.created_at else None,
            }
else:
    class AuditEventModel:
        pass

