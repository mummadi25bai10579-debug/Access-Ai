from typing import Dict, Any, List, Optional
from app.modules.schemes.repository import SchemeRepository
from app.modules.schemes.eligibility import RuleEvaluator, EligibilityStatus
from app.core.exceptions import SchemeNotFoundError

class SchemeService:
    def __init__(self, repository: SchemeRepository):
        self.repository = repository
        self.evaluator = RuleEvaluator()

    def list_schemes(self, state_code: Optional[str] = None) -> List[Dict[str, Any]]:
        return self.repository.list_schemes(state_code=state_code)

    def get_scheme_details(self, scheme_id: str) -> Dict[str, Any]:
        scheme = self.repository.get_scheme(scheme_id)
        if not scheme:
            raise SchemeNotFoundError(scheme_id)
        return scheme

    def evaluate_scheme(self, scheme_id: str, profile: Dict[str, Any]) -> Dict[str, Any]:
        scheme = self.get_scheme_details(scheme_id)
        rules = scheme.get("rules", [])

        matched = []
        unmatched = []
        unknown = []

        for rule in rules:
            is_match, status_type, message = self.evaluator.evaluate_rule(rule, profile)
            if status_type == "matched":
                matched.append(message)
            elif status_type == "unmatched":
                unmatched.append(message)
            else:
                unknown.append(message)

        if unmatched:
            status = EligibilityStatus.NOT_ELIGIBLE
        elif unknown:
            status = EligibilityStatus.POTENTIALLY_ELIGIBLE if matched else EligibilityStatus.INSUFFICIENT_INFORMATION
        else:
            status = EligibilityStatus.ELIGIBLE

        return {
            "scheme_id": scheme["id"],
            "scheme_name": scheme["name"],
            "eligibility_status": status.value,
            "matched_criteria": matched,
            "unmatched_criteria": unmatched,
            "unknown_criteria": unknown,
            "official_source": scheme["official_url"],
        }

    def match_all_schemes(self, profile: Dict[str, Any]) -> List[Dict[str, Any]]:
        schemes = self.repository.list_schemes(state_code=profile.get("state_code"))
        results = []
        for scheme in schemes:
            results.append(self.evaluate_scheme(scheme["id"], profile))
        return results
