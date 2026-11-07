from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from app.api.deps import get_current_user, get_education_service
from app.modules.education.service import EducationService

router = APIRouter()

class TutorRequest(BaseModel):
    message: str
    course_id: Optional[str] = None
    language: str = "en"
    difficulty_level: str = "beginner"

class LearningPathRequest(BaseModel):
    target_role: str = "Full-Stack AI Developer"
    user_skills: List[str] = Field(default_factory=list)

class QuizRequest(BaseModel):
    topic: str
    num_questions: int = 3
    difficulty_level: str = "beginner"

@router.post("/tutor")
async def tutor_chat(
    body: TutorRequest,
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user),
    service: EducationService = Depends(get_education_service),
):
    result = await service.tutor_chat(
        message=body.message,
        course_id=body.course_id,
        language=body.language,
        difficulty_level=body.difficulty_level,
    )
    return {
        "success": True,
        "data": result,
        "request_id": getattr(request.state, "request_id", "req-id"),
    }

@router.post("/learning-path")
async def get_learning_path(
    body: LearningPathRequest,
    request: Request,
    service: EducationService = Depends(get_education_service),
):
    result = service.generate_learning_path(body.target_role, body.user_skills)
    return {
        "success": True,
        "data": result,
        "request_id": getattr(request.state, "request_id", "req-id"),
    }

@router.post("/quiz/generate")
async def generate_quiz(
    body: QuizRequest,
    request: Request,
    service: EducationService = Depends(get_education_service),
):
    quiz = await service.generate_quiz(
        topic=body.topic,
        num_questions=body.num_questions,
        difficulty_level=body.difficulty_level,
    )
    return {
        "success": True,
        "data": quiz,
        "request_id": getattr(request.state, "request_id", "req-id"),
    }

@router.get("/progress")
async def get_progress(
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user),
    service: EducationService = Depends(get_education_service),
):
    progress = service.get_progress(user["id"])
    return {
        "success": True,
        "data": progress,
        "request_id": getattr(request.state, "request_id", "req-id"),
    }
