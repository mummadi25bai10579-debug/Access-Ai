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

    def evaluate_quiz_submission(
        self,
        user_id: str,
        course_id: Optional[str],
        answers: Optional[List[Dict[str, Any]]],
        client_score: Optional[float] = None,
        total_questions: Optional[int] = None,
        gap_analysis: Optional[List[Any]] = None,
    ) -> Dict[str, Any]:
        """
        Deterministically evaluates quiz answers on the backend.
        Never trusts client-supplied scores when answers are present.
        """
        if answers and len(answers) > 0:
            total = len(answers)
            correct = 0
            computed_gap = []
            for a in answers:
                sel = a.get("selected_option_index")
                cor = a.get("correct_option_index")
                if sel is not None and cor is not None and sel == cor:
                    correct += 1
                else:
                    computed_gap.append({
                        "question_id": a.get("question_id"),
                        "selected_option_index": sel,
                        "correct_option_index": cor,
                        "explanation": a.get("explanation", "Incorrect answer."),
                    })
            final_score = round((correct / total) * 100.0, 1)
            final_total = total
            final_gap = computed_gap
        else:
            final_score = client_score if client_score is not None else 0.0
            final_total = total_questions if total_questions is not None else 1
            final_gap = gap_analysis or []

        return self.repository.record_quiz_attempt(
            user_id=user_id,
            course_id=course_id,
            score=final_score,
            total_questions=final_total,
            gap_analysis=final_gap,
        )

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
