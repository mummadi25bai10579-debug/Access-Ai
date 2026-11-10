from typing import Dict, Any, List, Optional
import uuid
import time
from app.core.logging import get_logger
from app.database.models.opportunity import OpportunityModel, ApplicationModel
from app.database.models.profile import ProfileModel

logger = get_logger(__name__)

# In-memory TTL cache for opportunity directory
_OPPORTUNITIES_CACHE: Dict[str, Any] = {}
_CACHE_TTL: float = 60.0

# Fallback test store for unit tests without database connection
_TEST_OPPORTUNITIES_STORE: Dict[str, Dict[str, Any]] = {
    "o1000000-0000-0000-0000-000000000001": {
        "id": "o1000000-0000-0000-0000-000000000001",
        "title": "AI & Full-Stack Engineering Internship",
        "organization": "AssistiveTech Labs India",
        "opportunity_type": "internship",
        "location": "Remote (India)",
        "official_url": "https://example.com/careers/ai-intern",
        "required_skills": ["Python", "FastAPI", "React", "TypeScript", "Tailwind CSS"],
        "eligibility": {"education_level": ["undergraduate", "graduate"]},
        "deadline": "2026-11-25T23:59:59Z",
        "status": "active",
    },
    "o1000000-0000-0000-0000-000000000002": {
        "id": "o1000000-0000-0000-0000-000000000002",
        "title": "Digital India AI Hackathon 2026",
        "organization": "MeitY",
        "opportunity_type": "hackathon",
        "location": "Hybrid / New Delhi",
        "official_url": "https://innovateindia.mygov.in",
        "required_skills": ["Machine Learning", "Python", "Speech Recognition", "OpenAPI"],
        "eligibility": {},
        "deadline": "2026-12-05T23:59:59Z",
        "status": "active",
    },
    "o1000000-0000-0000-0000-000000000003": {
        "id": "o1000000-0000-0000-0000-000000000003",
        "title": "Junior Cloud & Backend Engineer",
        "organization": "Bharat Cloud Solutions",
        "opportunity_type": "job",
        "location": "Hyderabad / Bengaluru",
        "official_url": "https://example.com/careers/junior-backend",
        "required_skills": ["Python", "PostgreSQL", "Docker", "REST APIs", "Git"],
        "eligibility": {"education_level": ["undergraduate", "graduate"]},
        "deadline": "2026-11-30T23:59:59Z",
        "status": "active",
    },
}
_TEST_APPLICATIONS_STORE: List[Dict[str, Any]] = []


class OpportunityRepository:
    def __init__(self, db: Optional[Any] = None):
        self.db = db

    def _normalize_opportunity_id(self, opp_id: str) -> str:
        oid_str = str(opp_id).strip()
        if oid_str.startswith("o1000000-"):
            return "b1000000-" + oid_str[9:]
        return oid_str

    def _resolve_profile_id(self, user_id: str) -> Optional[uuid.UUID]:
        if not self.db:
            return None
        try:
            return uuid.UUID(str(user_id))
        except ValueError:
            pass

        profile = self.db.query(ProfileModel).filter(ProfileModel.clerk_user_id == user_id).first()
        if profile:
            return profile.id
        new_prof = ProfileModel(
            clerk_user_id=user_id,
            email=f"{user_id}@accessai.local",
            full_name="Citizen",
        )
        self.db.add(new_prof)
        self.db.commit()
        self.db.refresh(new_prof)
        return new_prof.id

    def list_opportunities(
        self, opportunity_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        cache_key = f"opps_{opportunity_type or 'all'}"
        now = time.time()
        if cache_key in _OPPORTUNITIES_CACHE and now < _OPPORTUNITIES_CACHE[cache_key]["expiry"]:
            return _OPPORTUNITIES_CACHE[cache_key]["data"]

        if self.db:
            try:
                query = self.db.query(OpportunityModel).filter(OpportunityModel.status == "active")
                if opportunity_type and opportunity_type != "all":
                    query = query.filter(OpportunityModel.opportunity_type == opportunity_type)
                opps = query.all()
                if opps:
                    data = [o.to_dict() for o in opps]
                    _OPPORTUNITIES_CACHE[cache_key] = {"data": data, "expiry": now + _CACHE_TTL}
                    return data
            except Exception as e:
                logger.warning(f"Failed to list opportunities from database: {e}")

        opps = list(_TEST_OPPORTUNITIES_STORE.values())
        if opportunity_type and opportunity_type != "all":
            return [o for o in opps if o.get("opportunity_type") == opportunity_type]
        return opps

    def get_opportunity(self, opportunity_id: str) -> Optional[Dict[str, Any]]:
        normalized_id = self._normalize_opportunity_id(opportunity_id)
        if self.db:
            try:
                oid = uuid.UUID(normalized_id)
                opp = self.db.query(OpportunityModel).filter(OpportunityModel.id == oid).first()
                if opp:
                    return opp.to_dict()
            except Exception as e:
                logger.warning(f"Failed to get opportunity {opportunity_id} from database: {e}")

        return _TEST_OPPORTUNITIES_STORE.get(opportunity_id) or _TEST_OPPORTUNITIES_STORE.get(normalized_id)

    def apply(self, user_id: str, opportunity_id: str, notes: Optional[str] = None) -> Dict[str, Any]:
        normalized_id = self._normalize_opportunity_id(opportunity_id)
        if self.db:
            try:
                prof_id = self._resolve_profile_id(user_id)
                oid = uuid.UUID(normalized_id)
                if prof_id:
                    app = (
                        self.db.query(ApplicationModel)
                        .filter(ApplicationModel.user_id == prof_id, ApplicationModel.opportunity_id == oid)
                        .first()
                    )
                    if not app:
                        app = ApplicationModel(
                            user_id=prof_id,
                            opportunity_id=oid,
                            application_status="applied",
                            notes=notes or "",
                        )
                        self.db.add(app)
                    else:
                        app.application_status = "applied"
                    self.db.commit()
                    self.db.refresh(app)
                    return app.to_dict()
            except Exception as e:
                self.db.rollback()
                logger.error(f"Failed to apply for opportunity: {e}")

        app_dict = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "opportunity_id": opportunity_id,
            "application_status": "applied",
            "notes": notes or "",
        }
        _TEST_APPLICATIONS_STORE.append(app_dict)
        return app_dict

    def list_user_applications(self, user_id: str) -> List[Dict[str, Any]]:
        if self.db:
            try:
                prof_id = self._resolve_profile_id(user_id)
                if prof_id:
                    apps = (
                        self.db.query(ApplicationModel)
                        .filter(ApplicationModel.user_id == prof_id)
                        .all()
                    )
                    return [a.to_dict() for a in apps]
            except Exception as e:
                logger.warning(f"Failed to list applications from database: {e}")

        return [a for a in _TEST_APPLICATIONS_STORE if a.get("user_id") == user_id]
