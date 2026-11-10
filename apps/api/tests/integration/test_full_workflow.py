import unittest
import asyncio
from app.modules.access.repository import DocumentRepository
from app.modules.access.service import AccessService
from app.modules.education.repository import EducationRepository
from app.modules.education.service import EducationService
from app.modules.schemes.repository import SchemeRepository
from app.modules.schemes.service import SchemeService
from app.modules.opportunities.repository import OpportunityRepository
from app.modules.opportunities.service import OpportunityService
from app.intelligence.providers.mock_provider import MockAIProvider
from app.intelligence.orchestrator.orchestrator import AIOrchestrator

class TestEndToEndWorkflow(unittest.TestCase):
    def setUp(self):
        self.mock_ai = MockAIProvider()
        self.orchestrator = AIOrchestrator(self.mock_ai)
        self.access = AccessService(self.orchestrator, DocumentRepository())
        self.education = EducationService(self.orchestrator, EducationRepository())
        self.schemes = SchemeService(SchemeRepository())
        self.opportunities = OpportunityService(OpportunityRepository())

    def test_e2e_user_journey_all_four_modules(self):
        user_id = "test-user-e2e-citizen-1"

        # 1. AccessAI: Upload Document and Ask Grounded Question
        doc = asyncio.run(
            self.access.process_document_upload_with_embeddings(
                user_id=user_id,
                filename="vidya_deevena_notice.txt",
                content="Jagananna Vidya Deevena provides full fee reimbursement. Students must have 75% attendance.",
            )
        )
        self.assertEqual(doc["status"], "completed")

        qa_res = asyncio.run(
            self.access.ask_document(
                user_id=user_id,
                document_id=doc["id"],
                question="What is the attendance requirement?",
            )
        )
        self.assertIn("answer", qa_res)
        self.assertIn("citations", qa_res)

        # 2. EduBridge: Course Discovery, Tutor, and Server-Validated Quiz
        courses = self.education.list_courses()
        self.assertGreater(len(courses), 0)
        course_id = courses[0]["id"]

        tutor_res = asyncio.run(
            self.education.tutor_chat(
                message="Explain variables in Python",
                course_id=course_id,
            )
        )
        self.assertIn("reply", tutor_res)

        # Submit quiz with answers (server calculates score)
        quiz_submission = [
            {"question_id": "q1", "selected_option_index": 1, "correct_option_index": 1},
            {"question_id": "q2", "selected_option_index": 0, "correct_option_index": 1},
        ]
        attempt = self.education.evaluate_quiz_submission(
            user_id=user_id,
            course_id=course_id,
            answers=quiz_submission,
        )
        self.assertEqual(attempt["score"], 50.0)
        self.assertEqual(attempt["total_questions"], 2)

        # 3. SchemeConnect: Deterministic Eligibility Evaluation
        citizen_profile = {
            "state_code": "AP",
            "education_level": "undergraduate",
            "annual_family_income": 180000,
            "category": "OBC",
        }
        scheme_matches = self.schemes.match_all_schemes(citizen_profile)
        self.assertGreater(len(scheme_matches), 0)
        # Jagananna Vidya Deevena should match
        vidya_match = next((s for s in scheme_matches if "Vidya Deevena" in s.get("scheme_name", "")), None)
        self.assertIsNotNone(vidya_match)
        self.assertEqual(vidya_match["eligibility_status"], "eligible")

        # 4. OpportunityBridge: Career Discovery, Skill Matching & Application
        opps = self.opportunities.list_opportunities()
        self.assertGreater(len(opps), 0)
        opp_id = opps[0]["id"]

        opp_matches = self.opportunities.match_opportunities(
            profile={"skills": ["Python", "FastAPI", "React"], "education_level": "undergraduate"}
        )
        self.assertGreater(len(opp_matches), 0)

        # Apply to opportunity
        app = self.opportunities.repository.apply(
            user_id=user_id,
            opportunity_id=opp_id,
            notes="Applying as full stack enthusiast",
        )
        self.assertEqual(app["application_status"], "applied")

if __name__ == "__main__":
    unittest.main()
