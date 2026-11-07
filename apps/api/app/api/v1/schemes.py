from fastapi import APIRouter, Depends, Request, Query
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from app.api.deps import get_scheme_service
from app.modules.schemes.service import SchemeService

router = APIRouter()

class SchemeMatchRequest(BaseModel):
    profile: Dict[str, Any]
    language: str = "en"

class CheckSingleEligibilityRequest(BaseModel):
    profile: Dict[str, Any]

@router.get("")
async def list_schemes(
    request: Request,
    state_code: Optional[str] = Query(None),
    service: SchemeService = Depends(get_scheme_service),
):
    schemes = service.list_schemes(state_code=state_code)
    return {
        "success": True,
        "data": schemes,
        "request_id": getattr(request.state, "request_id", "req-id"),
    }

@router.get("/{scheme_id}")
async def get_scheme(
    scheme_id: str,
    request: Request,
    service: SchemeService = Depends(get_scheme_service),
):
    scheme = service.get_scheme_details(scheme_id)
    return {
        "success": True,
        "data": scheme,
        "request_id": getattr(request.state, "request_id", "req-id"),
    }

@router.post("/match")
async def match_schemes(
    body: SchemeMatchRequest,
    request: Request,
    service: SchemeService = Depends(get_scheme_service),
):
    matches = service.match_all_schemes(body.profile)
    return {
        "success": True,
        "data": {"matches": matches},
        "request_id": getattr(request.state, "request_id", "req-id"),
    }

@router.post("/{scheme_id}/check-eligibility")
async def check_eligibility(
    scheme_id: str,
    body: CheckSingleEligibilityRequest,
    request: Request,
    service: SchemeService = Depends(get_scheme_service),
):
    result = service.evaluate_scheme(scheme_id, body.profile)
    return {
        "success": True,
        "data": result,
        "request_id": getattr(request.state, "request_id", "req-id"),
    }
