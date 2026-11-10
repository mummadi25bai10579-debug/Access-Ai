import uuid
from typing import Dict, Any, Optional
from app.database.session import Base, HAS_SQLALCHEMY

if HAS_SQLALCHEMY:
    from sqlalchemy import Column, String, Integer, Text, DateTime, JSON, ForeignKey, func
    from sqlalchemy.dialects.postgresql import UUID
    from pgvector.sqlalchemy import Vector

    class DocumentModel(Base):
        __tablename__ = "documents"

        id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
        user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
        filename = Column(String(255), nullable=False)
        storage_path = Column(String(512), nullable=False)
        mime_type = Column(String(100), nullable=False)
        status = Column(String(50), default="uploaded")
        detected_language = Column(String(10), default="en")
        extracted_text = Column(Text, nullable=True)
        simplified_text = Column(Text, nullable=True)
        translated_text = Column(Text, nullable=True)
        page_count = Column(Integer, default=1)
        metadata_ = Column("metadata", JSON, default=dict)
        created_at = Column(DateTime(timezone=True), server_default=func.now())
        updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

        def to_dict(self) -> Dict[str, Any]:
            return {
                "id": str(self.id),
                "user_id": str(self.user_id),
                "filename": self.filename,
                "storage_path": self.storage_path,
                "mime_type": self.mime_type,
                "status": self.status,
                "detected_language": self.detected_language,
                "extracted_text": self.extracted_text or "",
                "simplified_text": self.simplified_text or "",
                "translated_text": self.translated_text or "",
                "page_count": self.page_count,
                "created_at": self.created_at.isoformat() if self.created_at else None,
                "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            }

    class DocumentChunkModel(Base):
        __tablename__ = "document_chunks"

        id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
        document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
        user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
        chunk_index = Column(Integer, nullable=False)
        content = Column(Text, nullable=False)
        embedding = Column(Vector(384), nullable=True)
        page_number = Column(Integer, default=1)
        language = Column(String(10), default="en")
        metadata_ = Column("metadata", JSON, default=dict)
        created_at = Column(DateTime(timezone=True), server_default=func.now())

        def to_dict(self) -> Dict[str, Any]:
            return {
                "id": str(self.id),
                "document_id": str(self.document_id),
                "user_id": str(self.user_id),
                "chunk_index": self.chunk_index,
                "content": self.content,
                "page_number": self.page_number,
                "language": self.language,
                "created_at": self.created_at.isoformat() if self.created_at else None,
            }
else:
    class DocumentModel:
        pass
    class DocumentChunkModel:
        pass

