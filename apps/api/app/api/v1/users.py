from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.database.session import get_db
from app.database.repositories.profile_repository import ProfileRepository
from app.database.models.profile import ProfileModel
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter()

def get_profile_repo(db: Session = Depends(get_db)) -> ProfileRepository:
    return ProfileRepository(db)

class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    education_level: Optional[str] = None
    preferred_language: Optional[str] = None
    state_code: Optional[str] = None
    annual_family_income: Optional[float] = None
    category: Optional[str] = None
    skills: Optional[List[str]] = None
    accessibility_preferences: Optional[Dict[str, Any]] = None

class UpdatePreferencesRequest(BaseModel):
    voice_enabled: Optional[bool] = None
    simplified_language: Optional[bool] = None
    high_contrast: Optional[bool] = None
    font_scale: Optional[float] = None
    preferred_output: Optional[str] = None

@router.get("/me")
async def get_profile(
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user),
    repo: ProfileRepository = Depends(get_profile_repo),
):
    clerk_user_id = user["clerk_user_id"]
    profile = repo.get_by_clerk_id(clerk_user_id)
    if not profile:
        profile = repo.create_or_update(
            clerk_user_id=clerk_user_id,
            email=user.get("email"),
            full_name=user.get("claims", {}).get("name") or "Citizen",
        )
    return {
        "success": True,
        "data": profile,
        "request_id": getattr(request.state, "request_id", "req-id"),
    }

@router.get("/dashboard/stats")
async def get_dashboard_stats(
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    clerk_user_id = user["clerk_user_id"]
    prof = None
    if db:
        try:
            prof = db.query(ProfileModel).filter(ProfileModel.clerk_user_id == clerk_user_id).first()
        except Exception as e:
            logger.warning(f"Failed to query profile from DB: {e}")
            prof = None
    prof_id = prof.id if prof else None

    docs_count = 0
    progress_percent = 0.0
    apps_count = 0
    schemes_count = 0
    opps_count = 0
    unread_notifications = 0

    if db:
        from app.database.models.opportunity import OpportunityModel
        from app.database.models.scheme import SchemeModel

        try:
            from app.modules.schemes.repository import SchemeRepository
            from app.modules.opportunities.repository import OpportunityRepository
            from sqlalchemy import text

            schemes_count = len(SchemeRepository(db).list_schemes())
            opps_count = len(OpportunityRepository(db).list_opportunities())

            if prof_id:
                stmt = text("""
                    SELECT
                        (SELECT count(*) FROM documents WHERE user_id = :uid),
                        (SELECT count(*) FROM applications WHERE user_id = :uid),
                        (SELECT count(*) FROM notifications WHERE user_id = :uid AND read_at IS NULL),
                        (SELECT progress FROM learning_progress WHERE user_id = :uid LIMIT 1)
                """)
                res = db.execute(stmt, {"uid": prof_id}).fetchone()
                if res:
                    docs_count = res[0] or 0
                    apps_count = res[1] or 0
                    unread_notifications = res[2] or 0
                    progress_percent = float(res[3]) if res[3] is not None else 0.0
        except Exception as e:
            logger.warning(f"Error calculating stats: {e}")

    return {
        "success": True,
        "data": {
            "user_id": str(prof_id) if prof_id else clerk_user_id,
            "full_name": prof.full_name if prof and prof.full_name else (user.get("claims", {}).get("name") or "Citizen"),
            "state_code": prof.state_code if prof and prof.state_code else "AP",
            "annual_family_income": float(prof.annual_family_income) if prof and prof.annual_family_income is not None else 0.0,
            "education_level": prof.education_level if prof and prof.education_level else "undergraduate",
            "category": prof.category if prof and prof.category else "General",
            "skills": prof.skills if prof and isinstance(prof.skills, list) else [],
            "stats": {
                "uploaded_documents_count": docs_count,
                "learning_progress_percent": progress_percent,
                "matched_opportunities_count": opps_count,
                "matched_schemes_count": schemes_count,
                "eligible_schemes_count": schemes_count,
                "applications_count": apps_count,
                "unread_notifications_count": unread_notifications,
            },
        },
        "request_id": getattr(request.state, "request_id", "req-id"),
    }

@router.patch("/me")
@router.put("/me")
async def update_profile(
    body: UpdateProfileRequest,
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user),
    repo: ProfileRepository = Depends(get_profile_repo),
):
    clerk_user_id = user["clerk_user_id"]
    profile = repo.create_or_update(
        clerk_user_id=clerk_user_id,
        full_name=body.full_name,
        education_level=body.education_level,
        preferred_language=body.preferred_language,
        state_code=body.state_code,
        annual_family_income=body.annual_family_income,
        category=body.category,
        accessibility_preferences=body.accessibility_preferences,
        skills=body.skills,
    )
    return {
        "success": True,
        "data": profile,
        "request_id": getattr(request.state, "request_id", "req-id"),
    }

@router.patch("/preferences")
@router.put("/preferences")
async def update_preferences(
    body: UpdatePreferencesRequest,
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user),
    repo: ProfileRepository = Depends(get_profile_repo),
):
    clerk_user_id = user["clerk_user_id"]
    current_profile = repo.get_by_clerk_id(clerk_user_id) or {}
    current_prefs = current_profile.get("accessibility_preferences", {})
    for k, v in body.model_dump(exclude_unset=True).items():
        current_prefs[k] = v

    profile = repo.create_or_update(
        clerk_user_id=clerk_user_id,
        accessibility_preferences=current_prefs,
    )
    return {
        "success": True,
        "data": profile.get("accessibility_preferences", current_prefs),
        "request_id": getattr(request.state, "request_id", "req-id"),
    }
