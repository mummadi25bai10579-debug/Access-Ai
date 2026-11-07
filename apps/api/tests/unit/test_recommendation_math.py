import unittest
import sys
import os

# Add apps/api to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.intelligence.recommendations.engine import RecommendationEngine

class TestRecommendationEngine(unittest.TestCase):
    def setUp(self):
        self.engine = RecommendationEngine()

    def test_perfect_match(self):
        opportunity = {
            "id": "opp-1",
            "title": "AI Intern",
            "required_skills": ["Python", "FastAPI"],
            "eligibility": {"education_level": ["undergraduate"]},
            "location": "Remote",
            "status": "active",
        }
        user_profile = {
            "skills": ["Python", "FastAPI", "React"],
            "education_level": "undergraduate",
            "state_code": "AP",
        }

        match = self.engine.score_opportunity(opportunity, user_profile)
        self.assertTrue(match.is_eligible)
        self.assertGreater(match.final_score, 80)
        self.assertEqual(len(match.missing_skills), 0)

    def test_mandatory_eligibility_failure_clamps_to_zero(self):
        """Hard constraint rule: high semantic similarity must NEVER override failed eligibility."""
        opportunity = {
            "id": "opp-2",
            "title": "Senior AI Researcher",
            "required_skills": ["Python"],
            "eligibility": {"education_level": ["doctorate"]},
            "location": "Remote",
            "status": "active",
        }
        user_profile = {
            "skills": ["Python"],
            "education_level": "undergraduate",  # Not doctorate
        }

        match = self.engine.score_opportunity(opportunity, user_profile)
        self.assertFalse(match.is_eligible)
        self.assertEqual(match.final_score, 0.0)

    def test_missing_skills_calculation(self):
        opportunity = {
            "id": "opp-3",
            "title": "Full Stack Dev",
            "required_skills": ["Python", "React", "Docker", "Kubernetes"],
            "eligibility": {},
            "location": "Remote",
            "status": "active",
        }
        user_profile = {
            "skills": ["Python", "React"],
        }

        match = self.engine.score_opportunity(opportunity, user_profile)
        self.assertEqual(set(match.matching_skills), {"Python", "React"})
        self.assertEqual(set(match.missing_skills), {"Docker", "Kubernetes"})

if __name__ == "__main__":
    unittest.main()
