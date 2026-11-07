from typing import Dict, Any, List, Optional
import uuid

# Pre-seeded courses matching our seed.sql
_COURSES_STORE: Dict[str, Dict[str, Any]] = {
    "c1000000-0000-0000-0000-000000000001": {
        "id": "c1000000-0000-0000-0000-000000000001",
        "title": "Introduction to Python & Problem Solving",
        "description": "Foundations of algorithms, variables, logic, loops, and data structures.",
        "difficulty_level": "beginner",
        "topics": ["Variables & Data Types", "Conditionals & Loops", "Functions", "Lists & Dictionaries"],
    },
    "c1000000-0000-0000-0000-000000000002": {
        "id": "c1000000-0000-0000-0000-000000000002",
        "title": "Web Development & Accessible Interfaces",
        "description": "Accessible web design, HTML5 semantics, responsive CSS, and JavaScript fundamentals.",
        "difficulty_level": "beginner",
        "topics": ["Semantic HTML", "CSS Flexbox & Grid", "ARIA & Accessibility", "TypeScript Basics"],
    },
}

_PROGRESS_STORE: Dict[str, Dict[str, Any]] = {}

class EducationRepository:
    def list_courses(self) -> List[Dict[str, Any]]:
        return list(_COURSES_STORE.values())

    def get_course(self, course_id: str) -> Optional[Dict[str, Any]]:
        return _COURSES_STORE.get(course_id)

    def get_user_progress(self, user_id: str, course_id: str) -> Dict[str, Any]:
        key = f"{user_id}:{course_id}"
        return _PROGRESS_STORE.get(
            key,
            {
                "user_id": user_id,
                "course_id": course_id,
                "progress": 25.0,
                "mastery_score": 80.0,
                "current_topic": "Conditionals & Loops",
            },
        )

    def update_progress(self, user_id: str, course_id: str, progress: float, score: float) -> None:
        key = f"{user_id}:{course_id}"
        _PROGRESS_STORE[key] = {
            "user_id": user_id,
            "course_id": course_id,
            "progress": progress,
            "mastery_score": score,
        }
