import uuid
from typing import Dict, Any, Optional
from app.database.session import Base, HAS_SQLALCHEMY

if HAS_SQLALCHEMY:
    from sqlalchemy import Column, String, DateTime, JSON, ForeignKey, func, Text
    from sqlalchemy.dialects.postgresql import UUID

    class ConversationModel(Base):
        __tablename__ = "conversations"

        id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
        user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
        module = Column(String(50), nullable=False)
        title = Column(String(255), nullable=True)
        created_at = Column(DateTime(timezone=True), server_default=func.now())
        updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

        def to_dict(self) -> Dict[str, Any]:
            return {
                "id": str(self.id),
                "user_id": str(self.user_id),
                "module": self.module,
                "title": self.title or "",
                "created_at": self.created_at.isoformat() if self.created_at else None,
                "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            }

    class MessageModel(Base):
        __tablename__ = "messages"

        id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
        conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
        role = Column(String(50), nullable=False)
        content = Column(Text, nullable=False)
        citations = Column(JSON, default=list)
        metadata_ = Column("metadata", JSON, default=dict)
        created_at = Column(DateTime(timezone=True), server_default=func.now())

        def to_dict(self) -> Dict[str, Any]:
            return {
                "id": str(self.id),
                "conversation_id": str(self.conversation_id),
                "role": self.role,
                "content": self.content,
                "citations": self.citations if isinstance(self.citations, list) else [],
                "created_at": self.created_at.isoformat() if self.created_at else None,
            }
else:
    class ConversationModel:
        pass
    class MessageModel:
        pass

