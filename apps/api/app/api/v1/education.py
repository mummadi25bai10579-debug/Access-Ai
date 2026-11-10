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

class UpdateProgressRequest(BaseModel):
    course_id: str
    progress: float
    score: float = 0.0
    current_topic: Optional[str] = None

class QuizAnswerSubmission(BaseModel):
    question_id: str
    selected_option_index: int
    correct_option_index: Optional[int] = None
    explanation: Optional[str] = None

class SubmitQuizRequest(BaseModel):
    course_id: Optional[str] = None
    answers: Optional[List[QuizAnswerSubmission]] = None
    score: Optional[float] = None
    total_questions: Optional[int] = None
    gap_analysis: Optional[List[Any]] = None

@router.get("/courses")
async def list_courses(
    request: Request,
    service: EducationService = Depends(get_education_service),
):
    courses = service.list_courses()
    return {
        "success": True,
        "data": courses,
        "request_id": getattr(request.state, "request_id", "req-id"),
    }

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

@router.post("/quiz/submit")
async def submit_quiz(
    body: SubmitQuizRequest,
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user),
    service: EducationService = Depends(get_education_service),
):
    answer_dicts = [a.model_dump() for a in body.answers] if body.answers else None
    attempt = service.evaluate_quiz_submission(
        user_id=user["id"],
        course_id=body.course_id,
        answers=answer_dicts,
        client_score=body.score,
        total_questions=body.total_questions,
        gap_analysis=body.gap_analysis,
    )
    return {
        "success": True,
        "data": attempt,
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

@router.post("/progress")
async def update_progress(
    body: UpdateProgressRequest,
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user),
    service: EducationService = Depends(get_education_service),
):
    progress = service.repository.update_progress(
        user_id=user["id"],
        course_id=body.course_id,
        progress=body.progress,
        score=body.score,
        current_topic=body.current_topic,
    )
    return {
        "success": True,
        "data": progress,
        "request_id": getattr(request.state, "request_id", "req-id"),
    }
