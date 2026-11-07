from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from app.api.deps import get_current_user

router = APIRouter()

# In-memory mock profiles and preferences store
_USER_PROFILES: Dict[str, Dict[str, Any]] = {
    "00000000-0000-0000-0000-000000000001": {
        "id": "00000000-0000-0000-0000-000000000001",
        "full_name": "Lakshmi Narayana",
        "education_level": "undergraduate",
        "preferred_language": "te",
        "country_code": "IN",
        "state_code": "AP",
        "annual_family_income": 180000,
        "category": "BC-A",
        "skills": ["Python", "HTML", "CSS", "Problem Solving"],
    }
}

_USER_PREFERENCES: Dict[str, Dict[str, Any]] = {
    "00000000-0000-0000-0000-000000000001": {
        "voice_enabled": True,
        "simplified_language": False,
        "high_contrast": False,
        "font_scale": 1.1,
        "preferred_output": "text",
        "additional_languages": ["te", "hi"],
    }
}

class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    education_level: Optional[str] = None
    preferred_language: Optional[str] = None
    state_code: Optional[str] = None
    annual_family_income: Optional[float] = None
    skills: Optional[List[str]] = None

class UpdatePreferencesRequest(BaseModel):
    voice_enabled: Optional[bool] = None
    simplified_language: Optional[bool] = None
    high_contrast: Optional[bool] = None
    font_scale: Optional[float] = None
    preferred_output: Optional[str] = None

@router.get("/me")
async def get_profile(request: Request, user: Dict[str, Any] = Depends(get_current_user)):
    user_id = user["id"]
    profile = _USER_PROFILES.get(user_id, {
        "id": user_id,
        "full_name": "Student User",
        "education_level": "undergraduate",
        "preferred_language": "en",
        "country_code": "IN",
        "skills": ["Python"],
    })
    return {
        "success": True,
        "data": profile,
        "request_id": getattr(request.state, "request_id", "req-id"),
    }

@router.patch("/me")
async def update_profile(
    body: UpdateProfileRequest,
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user),
):
    user_id = user["id"]
    profile = _USER_PROFILES.setdefault(user_id, {"id": user_id})
    for k, v in body.model_dump(exclude_unset=True).items():
        profile[k] = v
    return {
        "success": True,
        "data": profile,
        "request_id": getattr(request.state, "request_id", "req-id"),
    }

@router.patch("/preferences")
async def update_preferences(
    body: UpdatePreferencesRequest,
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user),
):
    user_id = user["id"]
    prefs = _USER_PREFERENCES.setdefault(user_id, {})
    for k, v in body.model_dump(exclude_unset=True).items():
        prefs[k] = v
    return {
        "success": True,
        "data": prefs,
        "request_id": getattr(request.state, "request_id", "req-id"),
    }
