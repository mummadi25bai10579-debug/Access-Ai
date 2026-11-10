import uuid
from typing import Dict, Any, Optional
from app.database.session import Base, HAS_SQLALCHEMY

if HAS_SQLALCHEMY:
    from sqlalchemy import Column, String, DateTime, JSON, ForeignKey, func, Text
    from sqlalchemy.dialects.postgresql import UUID

    class OpportunityModel(Base):
        __tablename__ = "opportunities"

        id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
        title = Column(String(255), nullable=False)
        description = Column(Text, nullable=True)
        opportunity_type = Column(String(50), nullable=False, index=True)
        organization = Column(String(255), nullable=False)
        location = Column(String(255), nullable=True)
        official_url = Column(String(512), nullable=True)
        source_id = Column(UUID(as_uuid=True), ForeignKey("data_sources.id"), nullable=True)
        required_skills = Column(JSON, default=list)
        eligibility = Column(JSON, default=dict)
        deadline = Column(DateTime(timezone=True), nullable=True)
        last_verified_at = Column(DateTime(timezone=True), nullable=True)
        status = Column(String(50), default="active", index=True)
        created_at = Column(DateTime(timezone=True), server_default=func.now())

        def to_dict(self) -> Dict[str, Any]:
            return {
                "id": str(self.id),
                "title": self.title,
                "description": self.description or "",
                "opportunity_type": self.opportunity_type,
                "organization": self.organization,
                "location": self.location or "Remote",
                "official_url": self.official_url or "",
                "required_skills": self.required_skills if isinstance(self.required_skills, list) else [],
                "eligibility": self.eligibility or {},
                "deadline": self.deadline.isoformat() if self.deadline else None,
                "status": self.status,
                "created_at": self.created_at.isoformat() if self.created_at else None,
            }

    class ApplicationModel(Base):
        __tablename__ = "applications"

        id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
        user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
        opportunity_id = Column(UUID(as_uuid=True), ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False, index=True)
        application_status = Column(String(50), default="interested")
        notes = Column(Text, nullable=True)
        created_at = Column(DateTime(timezone=True), server_default=func.now())

        def to_dict(self) -> Dict[str, Any]:
            return {
                "id": str(self.id),
                "user_id": str(self.user_id),
                "opportunity_id": str(self.opportunity_id),
                "application_status": self.application_status,
                "notes": self.notes or "",
                "created_at": self.created_at.isoformat() if self.created_at else None,
            }
else:
    class OpportunityModel:
        pass
    class ApplicationModel:
        pass

