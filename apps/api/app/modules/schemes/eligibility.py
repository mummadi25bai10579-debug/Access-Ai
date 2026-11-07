from typing import Dict, Any, List
from enum import Enum

class EligibilityStatus(str, Enum):
    ELIGIBLE = "eligible"
    POTENTIALLY_ELIGIBLE = "potentially_eligible"
    NOT_ELIGIBLE = "not_eligible"
    INSUFFICIENT_INFORMATION = "insufficient_information"

class RuleEvaluator:
    """
    Deterministic rule evaluation engine for government scheme criteria.
    Guarantees zero hallucinations by executing exact Boolean and relational logic.
    """

    @staticmethod
    def evaluate_rule(rule: Dict[str, Any], user_profile: Dict[str, Any]) -> tuple[bool, str, str]:
        rule_key = rule.get("rule_key")
        operator = rule.get("operator")
        expected_value = rule.get("expected_value")
        desc = rule.get("description", f"{rule_key} {operator} {expected_value}")

        if rule_key not in user_profile or user_profile[rule_key] is None:
            return False, "unknown", f"Missing information for: {desc}"

        actual_val = user_profile[rule_key]

        # Evaluate based on operator
        try:
            if operator == "==":
                matched = str(actual_val).lower() == str(expected_value).lower()
            elif operator == "!=":
                matched = str(actual_val).lower() != str(expected_value).lower()
            elif operator == "<=":
                matched = float(actual_val) <= float(expected_value)
            elif operator == ">=":
                matched = float(actual_val) >= float(expected_value)
            elif operator == "<":
                matched = float(actual_val) < float(expected_value)
            elif operator == ">":
                matched = float(actual_val) > float(expected_value)
            elif operator == "in":
                # actual_val in expected_value list
                if isinstance(expected_value, list):
                    matched = str(actual_val).lower() in [str(x).lower() for x in expected_value]
                else:
                    matched = str(actual_val).lower() == str(expected_value).lower()
            elif operator == "contains":
                if isinstance(actual_val, list):
                    matched = str(expected_value).lower() in [str(x).lower() for x in actual_val]
                else:
                    matched = str(expected_value).lower() in str(actual_val).lower()
            else:
                return False, "unknown", f"Unsupported operator: {operator}"

            if matched:
                return True, "matched", f"Satisfied: {desc} (User value: {actual_val})"
            else:
                return False, "unmatched", f"Failed: {desc} (User value: {actual_val})"
        except Exception as e:
            return False, "unknown", f"Evaluation error on {desc}: {str(e)}"
