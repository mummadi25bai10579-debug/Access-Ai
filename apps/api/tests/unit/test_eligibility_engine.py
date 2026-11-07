import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.modules.schemes.eligibility import RuleEvaluator, EligibilityStatus
from app.modules.schemes.service import SchemeService
from app.modules.schemes.repository import SchemeRepository

class TestEligibilityEngine(unittest.TestCase):
    def setUp(self):
        self.evaluator = RuleEvaluator()
        self.service = SchemeService(SchemeRepository())

    def test_income_inequality_operator(self):
        rule = {
            "rule_key": "annual_family_income",
            "operator": "<=",
            "expected_value": 250000,
            "description": "Income <= 250000",
        }
        # Eligible user
        matched, status, _ = self.evaluator.evaluate_rule(rule, {"annual_family_income": 200000})
        self.assertTrue(matched)
        self.assertEqual(status, "matched")

        # Ineligible user
        matched, status, _ = self.evaluator.evaluate_rule(rule, {"annual_family_income": 350000})
        self.assertFalse(matched)
        self.assertEqual(status, "unmatched")

    def test_in_list_operator(self):
        rule = {
            "rule_key": "education_level",
            "operator": "in",
            "expected_value": ["diploma", "undergraduate"],
        }
        matched, _, _ = self.evaluator.evaluate_rule(rule, {"education_level": "undergraduate"})
        self.assertTrue(matched)

        matched, _, _ = self.evaluator.evaluate_rule(rule, {"education_level": "high_school"})
        self.assertFalse(matched)

    def test_missing_info_returns_unknown(self):
        rule = {
            "rule_key": "category",
            "operator": "==",
            "expected_value": "farmer",
        }
        matched, status, _ = self.evaluator.evaluate_rule(rule, {})
        self.assertFalse(matched)
        self.assertEqual(status, "unknown")

    def test_vidya_deevena_scheme_evaluation(self):
        # Lakshmi: AP resident, undergraduate, family income 180,000
        profile = {
            "state_code": "AP",
            "education_level": "undergraduate",
            "annual_family_income": 180000,
        }
        res = self.service.evaluate_scheme("s1000000-0000-0000-0000-000000000002", profile)
        self.assertEqual(res["eligibility_status"], EligibilityStatus.ELIGIBLE.value)
        self.assertEqual(len(res["unmatched_criteria"]), 0)
        self.assertEqual(res["official_source"], "https://jnanabhumi.ap.gov.in")

if __name__ == "__main__":
    unittest.main()
