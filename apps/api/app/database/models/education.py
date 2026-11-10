import uuid
from typing import Dict, Any, Optional
from app.database.session import Base, HAS_SQLALCHEMY

if HAS_SQLALCHEMY:
    from sqlalchemy import Column, String, Integer, Numeric, DateTime, JSON, ForeignKey, func, Text
    from sqlalchemy.dialects.postgresql import UUID

    class CourseModel(Base):
        __tablename__ = "courses"

        id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
        title = Column(String(255), nullable=False)
        description = Column(Text, nullable=True)
        language = Column(String(10), default="en")
        difficulty_level = Column(String(50), default="beginner")
        source_id = Column(UUID(as_uuid=True), ForeignKey("data_sources.id"), nullable=True)
        metadata_ = Column("metadata", JSON, default=dict)
        created_at = Column(DateTime(timezone=True), server_default=func.now())

        def to_dict(self) -> Dict[str, Any]:
            return {
                "id": str(self.id),
                "title": self.title,
                "description": self.description or "",
                "language": self.language,
                "difficulty_level": self.difficulty_level,
                "topics": (self.metadata_ or {}).get("topics", []),
                "created_at": self.created_at.isoformat() if self.created_at else None,
            }

    class CourseMaterialModel(Base):
        __tablename__ = "course_materials"

        id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
        course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
        title = Column(String(255), nullable=False)
        content = Column(Text, nullable=False)
        order_index = Column(Integer, default=0)
        created_at = Column(DateTime(timezone=True), server_default=func.now())

        def to_dict(self) -> Dict[str, Any]:
            return {
                "id": str(self.id),
                "course_id": str(self.course_id),
                "title": self.title,
                "content": self.content,
                "order_index": self.order_index,
                "created_at": self.created_at.isoformat() if self.created_at else None,
            }

    class LearningProgressModel(Base):
        __tablename__ = "learning_progress"

        id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
        user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
        course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
        progress = Column(Numeric, default=0)
        mastery_score = Column(Numeric, default=0)
        current_topic = Column(String(255), nullable=True)
        updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

        def to_dict(self) -> Dict[str, Any]:
            return {
                "id": str(self.id),
                "user_id": str(self.user_id),
                "course_id": str(self.course_id),
                "progress": float(self.progress) if self.progress is not None else 0.0,
                "mastery_score": float(self.mastery_score) if self.mastery_score is not None else 0.0,
                "current_topic": self.current_topic or "",
                "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            }

    class QuizAttemptModel(Base):
        __tablename__ = "quiz_attempts"

        id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
        user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
        course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=True, index=True)
        score = Column(Numeric, nullable=False)
        total_questions = Column(Integer, nullable=False)
        gap_analysis = Column(JSON, default=list)
        created_at = Column(DateTime(timezone=True), server_default=func.now())

        def to_dict(self) -> Dict[str, Any]:
            return {
                "id": str(self.id),
                "user_id": str(self.user_id),
                "course_id": str(self.course_id) if self.course_id else None,
                "score": float(self.score),
                "total_questions": self.total_questions,
                "gap_analysis": self.gap_analysis or [],
                "created_at": self.created_at.isoformat() if self.created_at else None,
            }
else:
    class CourseModel:
        pass
    class CourseMaterialModel:
        pass
    class LearningProgressModel:
        pass
    class QuizAttemptModel:
        pass

