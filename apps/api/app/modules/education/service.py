from typing import Dict, Any, List, Optional
from app.modules.education.repository import EducationRepository
from app.intelligence.orchestrator.orchestrator import AIOrchestrator

class EducationService:
    def __init__(self, orchestrator: AIOrchestrator, repository: EducationRepository):
        self.orchestrator = orchestrator
        self.repository = repository

    def list_courses(self) -> List[Dict[str, Any]]:
        return self.repository.list_courses()

    def get_progress(self, user_id: str, course_id: Optional[str] = None) -> Dict[str, Any]:
        default_course_id = course_id or "c1000000-0000-0000-0000-000000000001"
        return self.repository.get_user_progress(user_id, default_course_id)

    async def tutor_chat(
        self,
        message: str,
        course_id: Optional[str] = None,
        language: str = "en",
        difficulty_level: str = "beginner",
    ) -> Dict[str, Any]:
        context = ""
        if course_id:
            course = self.repository.get_course(course_id)
            if course:
                context = f"Course: {course['title']}. Topics: {', '.join(course.get('topics', []))}"

        return await self.orchestrator.tutor_dialogue(
            message=message,
            context_materials=context,
            target_language=language,
            difficulty_level=difficulty_level,
        )

    async def generate_quiz(
        self,
        topic: str,
        num_questions: int = 3,
        difficulty_level: str = "beginner",
    ) -> Dict[str, Any]:
        schema = {
            "type": "object",
            "properties": {
                "topic": {"type": "string"},
                "questions": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "question_id": {"type": "string"},
                            "question_text": {"type": "string"},
                            "options": {"type": "array", "items": {"type": "string"}},
                            "correct_option_index": {"type": "integer"},
                            "explanation": {"type": "string"},
                        },
                    },
                },
            },
        }
        prompt = f"Generate {num_questions} multiple-choice quiz questions on topic: '{topic}' at {difficulty_level} level."
        return await self.orchestrator.provider.generate_structured(prompt, schema)

    def generate_learning_path(self, target_role: str, user_skills: List[str]) -> Dict[str, Any]:
        pathway = [
            {"step": 1, "topic": "Python Programming Foundations", "status": "completed" if "python" in [s.lower() for s in user_skills] else "recommended"},
            {"step": 2, "topic": "Data Structures & Algorithm Basics", "status": "recommended"},
            {"step": 3, "topic": "API Development with FastAPI", "status": "locked"},
            {"step": 4, "topic": "Frontend Integration with Next.js", "status": "locked"},
        ]
        return {
            "target_role": target_role,
            "pathway": pathway,
            "estimated_weeks": 6,
        }
