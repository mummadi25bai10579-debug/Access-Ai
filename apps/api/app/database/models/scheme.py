import uuid
from typing import Dict, Any, Optional
from app.database.session import Base, HAS_SQLALCHEMY

if HAS_SQLALCHEMY:
    from sqlalchemy import Column, String, Boolean, DateTime, JSON, ForeignKey, func, Text
    from sqlalchemy.dialects.postgresql import UUID

    class SchemeModel(Base):
        __tablename__ = "schemes"

        id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
        name = Column(String(255), nullable=False)
        description = Column(Text, nullable=True)
        official_url = Column(String(512), nullable=True)
        source_id = Column(UUID(as_uuid=True), ForeignKey("data_sources.id"), nullable=True)
        state_code = Column(String(10), nullable=True, index=True)
        eligibility = Column(JSON, default=dict)
        required_documents = Column(JSON, default=list)
        application_deadline = Column(DateTime(timezone=True), nullable=True)
        last_verified_at = Column(DateTime(timezone=True), nullable=True)
        status = Column(String(50), default="active", index=True)
        created_at = Column(DateTime(timezone=True), server_default=func.now())

        def to_dict(self) -> Dict[str, Any]:
            return {
                "id": str(self.id),
                "name": self.name,
                "description": self.description or "",
                "official_url": self.official_url or "",
                "state_code": self.state_code,
                "eligibility": self.eligibility or {},
                "required_documents": self.required_documents if isinstance(self.required_documents, list) else [],
                "application_deadline": self.application_deadline.isoformat() if self.application_deadline else None,
                "status": self.status,
                "created_at": self.created_at.isoformat() if self.created_at else None,
            }

    class SchemeEligibilityRuleModel(Base):
        __tablename__ = "scheme_eligibility_rules"

        id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
        scheme_id = Column(UUID(as_uuid=True), ForeignKey("schemes.id", ondelete="CASCADE"), nullable=False, index=True)
        rule_key = Column(String(100), nullable=False)
        operator = Column(String(20), nullable=False)
        expected_value = Column(JSON, nullable=False)
        is_mandatory = Column(Boolean, default=True)
        description = Column(Text, nullable=True)

        def to_dict(self) -> Dict[str, Any]:
            return {
                "id": str(self.id),
                "scheme_id": str(self.scheme_id),
                "rule_key": self.rule_key,
                "operator": self.operator,
                "expected_value": self.expected_value,
                "is_mandatory": self.is_mandatory,
                "description": self.description or "",
            }
else:
    class SchemeModel:
        pass
    class SchemeEligibilityRuleModel:
        pass

