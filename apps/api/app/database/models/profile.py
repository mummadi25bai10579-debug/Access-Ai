import uuid
from typing import Dict, Any, Optional
from app.database.session import Base, HAS_SQLALCHEMY

if HAS_SQLALCHEMY:
    from sqlalchemy import Column, String, Numeric, DateTime, JSON, func
    from sqlalchemy.dialects.postgresql import UUID

    class ProfileModel(Base):
        __tablename__ = "profiles"

        id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
        clerk_user_id = Column(String(128), unique=True, nullable=False, index=True)
        full_name = Column(String(255), nullable=True)
        email = Column(String(255), nullable=True, index=True)
        education_level = Column(String(100), nullable=True)
        preferred_language = Column(String(10), default="en")
        country_code = Column(String(10), default="IN")
        state_code = Column(String(10), nullable=True)
        annual_family_income = Column(Numeric, nullable=True)
        category = Column(String(50), nullable=True)
        accessibility_preferences = Column(JSON, default=dict)
        skills = Column(JSON, default=list)
        created_at = Column(DateTime(timezone=True), server_default=func.now())
        updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

        def to_dict(self) -> Dict[str, Any]:
            return {
                "id": str(self.id),
                "clerk_user_id": self.clerk_user_id,
                "full_name": self.full_name or "",
                "email": self.email or "",
                "education_level": self.education_level or "undergraduate",
                "preferred_language": self.preferred_language or "en",
                "country_code": self.country_code or "IN",
                "state_code": self.state_code or "AP",
                "annual_family_income": float(self.annual_family_income) if self.annual_family_income is not None else 180000.0,
                "category": self.category or "General",
                "accessibility_preferences": self.accessibility_preferences or {},
                "skills": self.skills if isinstance(self.skills, list) else [],
                "created_at": self.created_at.isoformat() if self.created_at else None,
                "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            }
else:
    class ProfileModel:
        def __init__(self, clerk_user_id: str, **kwargs):
            self.id = uuid.uuid4()
            self.clerk_user_id = clerk_user_id
            for k, v in kwargs.items():
                setattr(self, k, v)

        def to_dict(self) -> Dict[str, Any]:
            return {
                "id": str(getattr(self, "id", "")),
                "clerk_user_id": getattr(self, "clerk_user_id", ""),
                "full_name": getattr(self, "full_name", ""),
                "email": getattr(self, "email", ""),
                "education_level": getattr(self, "education_level", "undergraduate"),
                "preferred_language": getattr(self, "preferred_language", "en"),
                "country_code": getattr(self, "country_code", "IN"),
                "state_code": getattr(self, "state_code", "AP"),
                "annual_family_income": float(getattr(self, "annual_family_income", 180000.0)),
                "category": getattr(self, "category", "General"),
                "accessibility_preferences": getattr(self, "accessibility_preferences", {}),
                "skills": getattr(self, "skills", []),
                "created_at": None,
                "updated_at": None,
            }
