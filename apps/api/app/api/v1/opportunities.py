from fastapi import APIRouter, Depends, Request, Query
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from app.api.deps import get_current_user, get_opportunity_service
from app.modules.opportunities.service import OpportunityService

router = APIRouter()

class OpportunityMatchRequest(BaseModel):
    profile: Dict[str, Any]
    filters: Optional[Dict[str, Any]] = None

class ResumeAnalyzeRequest(BaseModel):
    resume_text: str

class SkillGapRequest(BaseModel):
    opportunity_id: str
    user_skills: List[str]

class ApplyOpportunityRequest(BaseModel):
    notes: Optional[str] = None

@router.get("")
async def list_opportunities(
    request: Request,
    opportunity_type: Optional[str] = Query(None),
    service: OpportunityService = Depends(get_opportunity_service),
):
    opps = service.list_opportunities(opp_type=opportunity_type)
    return {
        "success": True,
        "data": opps,
        "request_id": getattr(request.state, "request_id", "req-id"),
    }

@router.get("/applications/me")
async def list_my_applications(
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user),
    service: OpportunityService = Depends(get_opportunity_service),
):
    apps = service.repository.list_user_applications(user["id"])
    return {
        "success": True,
        "data": apps,
        "request_id": getattr(request.state, "request_id", "req-id"),
    }

@router.get("/{opportunity_id}")
async def get_opportunity(
    opportunity_id: str,
    request: Request,
    service: OpportunityService = Depends(get_opportunity_service),
):
    opp = service.get_opportunity(opportunity_id)
    return {
        "success": True,
        "data": opp,
        "request_id": getattr(request.state, "request_id", "req-id"),
    }

@router.post("/{opportunity_id}/apply")
async def apply_to_opportunity(
    opportunity_id: str,
    body: ApplyOpportunityRequest,
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user),
    service: OpportunityService = Depends(get_opportunity_service),
):
    app = service.repository.apply(
        user_id=user["id"],
        opportunity_id=opportunity_id,
        notes=body.notes,
    )
    return {
        "success": True,
        "data": app,
        "request_id": getattr(request.state, "request_id", "req-id"),
    }

@router.post("/match")
async def match_opportunities(
    body: OpportunityMatchRequest,
    request: Request,
    service: OpportunityService = Depends(get_opportunity_service),
):
    matches = service.match_opportunities(body.profile, filters=body.filters)
    return {
        "success": True,
        "data": {"matches": matches},
        "request_id": getattr(request.state, "request_id", "req-id"),
    }

@router.post("/resume/analyze")
async def analyze_resume(
    body: ResumeAnalyzeRequest,
    request: Request,
    service: OpportunityService = Depends(get_opportunity_service),
):
    result = service.analyze_resume(body.resume_text)
    return {
        "success": True,
        "data": result,
        "request_id": getattr(request.state, "request_id", "req-id"),
    }

@router.post("/skill-gap")
async def analyze_skill_gap(
    body: SkillGapRequest,
    request: Request,
    service: OpportunityService = Depends(get_opportunity_service),
):
    result = service.calculate_skill_gap(body.opportunity_id, body.user_skills)
    return {
        "success": True,
        "data": result,
        "request_id": getattr(request.state, "request_id", "req-id"),
    }
