from typing import Dict, Any, List, Optional
import uuid
import time
from app.core.logging import get_logger
from app.database.models.education import CourseModel, CourseMaterialModel, LearningProgressModel, QuizAttemptModel
from app.database.models.profile import ProfileModel

logger = get_logger(__name__)

# In-memory TTL cache for course catalog
_COURSES_CACHE: Dict[str, Any] = {}
_CACHE_TTL: float = 60.0

# Fallback test store for unit tests without database connection
_TEST_COURSES_STORE: Dict[str, Dict[str, Any]] = {
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
_TEST_PROGRESS_STORE: Dict[str, Dict[str, Any]] = {}
_TEST_QUIZ_ATTEMPTS: List[Dict[str, Any]] = []


class EducationRepository:
    def __init__(self, db: Optional[Any] = None):
        self.db = db

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

    def list_courses(self) -> List[Dict[str, Any]]:
        now = time.time()
        if "courses" in _COURSES_CACHE and now < _COURSES_CACHE["courses"]["expiry"]:
            return _COURSES_CACHE["courses"]["data"]

        if self.db:
            try:
                courses = self.db.query(CourseModel).all()
                if courses:
                    data = [c.to_dict() for c in courses]
                    _COURSES_CACHE["courses"] = {"data": data, "expiry": now + _CACHE_TTL}
                    return data
            except Exception as e:
                logger.warning(f"Failed to list courses from database: {e}")

        return list(_TEST_COURSES_STORE.values())

    def get_course(self, course_id: str) -> Optional[Dict[str, Any]]:
        if self.db:
            try:
                cid = uuid.UUID(str(course_id))
                course = self.db.query(CourseModel).filter(CourseModel.id == cid).first()
                if course:
                    return course.to_dict()
            except Exception as e:
                logger.warning(f"Failed to get course {course_id} from database: {e}")

        return _TEST_COURSES_STORE.get(course_id)

    def get_user_progress(self, user_id: str, course_id: str) -> Dict[str, Any]:
        if self.db:
            try:
                prof_id = self._resolve_profile_id(user_id)
                cid = uuid.UUID(str(course_id))
                if prof_id:
                    prog = (
                        self.db.query(LearningProgressModel)
                        .filter(
                            LearningProgressModel.user_id == prof_id,
                            LearningProgressModel.course_id == cid,
                        )
                        .first()
                    )
                    if prog:
                        return prog.to_dict()
                    return {
                        "user_id": str(prof_id),
                        "course_id": str(cid),
                        "progress": 0.0,
                        "mastery_score": 0.0,
                        "current_topic": "Not Started",
                    }
            except Exception as e:
                logger.warning(f"Failed to get progress from database: {e}")

        key = f"{user_id}:{course_id}"
        return _TEST_PROGRESS_STORE.get(
            key,
            {
                "user_id": user_id,
                "course_id": course_id,
                "progress": 0.0,
                "mastery_score": 0.0,
                "current_topic": "Not Started",
            },
        )

    def update_progress(
        self,
        user_id: str,
        course_id: str,
        progress: float,
        score: float,
        current_topic: Optional[str] = None,
    ) -> Dict[str, Any]:
        if self.db:
            try:
                prof_id = self._resolve_profile_id(user_id)
                cid = uuid.UUID(str(course_id))
                if prof_id:
                    prog = (
                        self.db.query(LearningProgressModel)
                        .filter(
                            LearningProgressModel.user_id == prof_id,
                            LearningProgressModel.course_id == cid,
                        )
                        .first()
                    )
                    if not prog:
                        prog = LearningProgressModel(
                            user_id=prof_id,
                            course_id=cid,
                            progress=progress,
                            mastery_score=score,
                            current_topic=current_topic or "",
                        )
                        self.db.add(prog)
                    else:
                        prog.progress = progress
                        prog.mastery_score = score
                        if current_topic:
                            prog.current_topic = current_topic
                    self.db.commit()
                    self.db.refresh(prog)
                    return prog.to_dict()
            except Exception as e:
                self.db.rollback()
                logger.error(f"Failed to update progress in database: {e}")

        key = f"{user_id}:{course_id}"
        data = {
            "user_id": user_id,
            "course_id": course_id,
            "progress": progress,
            "mastery_score": score,
            "current_topic": current_topic or "In Progress",
        }
        _TEST_PROGRESS_STORE[key] = data
        return data

    def record_quiz_attempt(
        self,
        user_id: str,
        course_id: Optional[str],
        score: float,
        total_questions: int,
        gap_analysis: Optional[List[Any]] = None,
    ) -> Dict[str, Any]:
        if self.db:
            try:
                prof_id = self._resolve_profile_id(user_id)
                cid = uuid.UUID(str(course_id)) if course_id else None
                if prof_id:
                    attempt = QuizAttemptModel(
                        user_id=prof_id,
                        course_id=cid,
                        score=score,
                        total_questions=total_questions,
                        gap_analysis=gap_analysis or [],
                    )
                    self.db.add(attempt)
                    self.db.commit()
                    self.db.refresh(attempt)
                    return attempt.to_dict()
            except Exception as e:
                self.db.rollback()
                logger.error(f"Failed to record quiz attempt in database: {e}")

        res = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "course_id": course_id,
            "score": score,
            "total_questions": total_questions,
            "gap_analysis": gap_analysis or [],
        }
        _TEST_QUIZ_ATTEMPTS.append(res)
        return res
