import unittest
import sys
import os
import asyncio

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.api.deps import (
    get_access_service,
    get_education_service,
    get_scheme_service,
    get_opportunity_service,
)

class TestApiServicesIntegration(unittest.TestCase):
    def setUp(self):
        self.access = get_access_service()
        self.education = get_education_service()
        self.schemes = get_scheme_service()
        self.opportunities = get_opportunity_service()

    def test_document_ingestion_and_grounded_qa(self):
        # 1. Ingest document
        doc = self.access.process_document_upload(
            user_id="test-user-1",
            filename="scholarship_circular.txt",
            content="The final submission deadline for National Scholarship is 31st December 2026. Applicants must have 75% attendance.",
        )
        self.assertEqual(doc["status"], "completed")

        # 2. Ask question
        res = asyncio.run(
            self.access.ask_document(
                user_id="test-user-1",
                document_id=doc["id"],
                question="What is the submission deadline?",
                language="en",
            )
        )
        self.assertIn("answer", res)
        self.assertIn("citations", res)
        self.assertEqual(res["language"], "en")

    def test_scheme_matching_pipeline(self):
        profile = {
            "state_code": "AP",
            "education_level": "undergraduate",
            "annual_family_income": 150000,
        }
        matches = self.schemes.match_all_schemes(profile)
        self.assertGreater(len(matches), 0)
        # Check that Jagananna Vidya Deevena is matched
        vidya_match = next((m for m in matches if "Vidya Deevena" in m["scheme_name"]), None)
        self.assertIsNotNone(vidya_match)
        self.assertEqual(vidya_match["eligibility_status"], "eligible")

    def test_opportunity_matching_pipeline(self):
        profile = {
            "skills": ["Python", "FastAPI", "React", "TypeScript"],
            "education_level": "undergraduate",
        }
        matches = self.opportunities.match_opportunities(profile)
        self.assertGreater(len(matches), 0)
        top_match = matches[0]
        self.assertGreater(top_match["match_score"], 70)
        self.assertEqual(top_match["eligibility_status"], "eligible")

    def test_education_tutor_and_quiz(self):
        dialogue = asyncio.run(
            self.education.tutor_chat(message="Can you explain loops in Python?", language="en")
        )
        self.assertIn("reply", dialogue)

        quiz = asyncio.run(
            self.education.generate_quiz(topic="Python Basics", num_questions=2)
        )
        self.assertIn("questions", quiz)

if __name__ == "__main__":
    unittest.main()
