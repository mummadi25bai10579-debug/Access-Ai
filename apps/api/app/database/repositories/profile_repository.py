from typing import Optional, Dict, Any, List

try:
    from sqlalchemy.orm import Session
except ImportError:
    Session = Any

from app.database.models.profile import ProfileModel
from app.core.logging import get_logger

logger = get_logger(__name__)

# In-memory store fallback for offline tests or when remote DB is initializing
_IN_MEMORY_PROFILES: Dict[str, Dict[str, Any]] = {}

class ProfileRepository:
    def __init__(self, db: Optional[Any] = None):
        self.db = db

    def get_by_clerk_id(self, clerk_user_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves user profile strictly matching the verified Clerk user ID.
        Prevents cross-tenant access.
        """
        if self.db and hasattr(self.db, "query"):
            try:
                record = self.db.query(ProfileModel).filter(ProfileModel.clerk_user_id == clerk_user_id).first()
                if record:
                    return record.to_dict()
            except Exception as e:
                logger.warning(f"Database query error for clerk user {clerk_user_id}: {e}")

        return _IN_MEMORY_PROFILES.get(clerk_user_id)

    def create_or_update(
        self,
        clerk_user_id: str,
        full_name: Optional[str] = None,
        email: Optional[str] = None,
        education_level: Optional[str] = None,
        preferred_language: Optional[str] = None,
        state_code: Optional[str] = None,
        annual_family_income: Optional[float] = None,
        category: Optional[str] = None,
        accessibility_preferences: Optional[Dict[str, Any]] = None,
        skills: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Creates or updates a profile for the verified Clerk identity.
        Ownership is strictly derived from the verified backend identity.
        """
        if self.db and hasattr(self.db, "query"):
            try:
                record = self.db.query(ProfileModel).filter(ProfileModel.clerk_user_id == clerk_user_id).first()
                if not record:
                    record = ProfileModel(
                        clerk_user_id=clerk_user_id,
                        full_name=full_name or "Citizen",
                        email=email or f"{clerk_user_id}@accessai.local",
                        education_level=education_level or "undergraduate",
                        preferred_language=preferred_language or "en",
                        country_code="IN",
                        state_code=state_code or "AP",
                        annual_family_income=annual_family_income or 0.0,
                        category=category or "General",
                        accessibility_preferences=accessibility_preferences or {},
                        skills=skills or [],
                    )
                    self.db.add(record)
                else:
                    if full_name is not None:
                        record.full_name = full_name
                    if email is not None:
                        record.email = email
                    if education_level is not None:
                        record.education_level = education_level
                    if preferred_language is not None:
                        record.preferred_language = preferred_language
                    if state_code is not None:
                        record.state_code = state_code
                    if annual_family_income is not None:
                        record.annual_family_income = annual_family_income
                    if category is not None:
                        record.category = category
                    if accessibility_preferences is not None:
                        record.accessibility_preferences = accessibility_preferences
                    if skills is not None:
                        record.skills = skills

                self.db.flush()
                return record.to_dict()
            except Exception as e:
                logger.warning(f"Database save error for clerk user {clerk_user_id}: {e}")

        # In-memory storage fallback
        existing = _IN_MEMORY_PROFILES.get(clerk_user_id, {
            "id": f"prof-{clerk_user_id}",
            "clerk_user_id": clerk_user_id,
            "full_name": full_name or "Citizen",
            "email": email or f"{clerk_user_id}@accessai.local",
            "education_level": education_level or "undergraduate",
            "preferred_language": preferred_language or "en",
            "country_code": "IN",
            "state_code": state_code or "AP",
            "annual_family_income": annual_family_income or 0.0,
            "category": category or "General",
            "accessibility_preferences": accessibility_preferences or {},
            "skills": skills or [],
        })

        if full_name is not None: existing["full_name"] = full_name
        if email is not None: existing["email"] = email
        if education_level is not None: existing["education_level"] = education_level
        if preferred_language is not None: existing["preferred_language"] = preferred_language
        if state_code is not None: existing["state_code"] = state_code
        if annual_family_income is not None: existing["annual_family_income"] = annual_family_income
        if category is not None: existing["category"] = category
        if accessibility_preferences is not None: existing["accessibility_preferences"] = accessibility_preferences
        if skills is not None: existing["skills"] = skills

        _IN_MEMORY_PROFILES[clerk_user_id] = existing
        return existing
