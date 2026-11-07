from typing import List, Dict, Any, Set
from dataclasses import dataclass

@dataclass
class ScoredMatch:
    item_id: str
    title: str
    final_score: float # 0 to 100
    eligibility_score: float
    relevance_score: float
    preference_score: float
    freshness_score: float
    is_eligible: bool
    matching_skills: List[str]
    missing_skills: List[str]
    explanation: str

class RecommendationEngine:
    """
    Evaluates matches using formula: S = w1*E + w2*R + w3*P + w4*F
    With hard gate on mandatory eligibility.
    """

    def __init__(
        self,
        w1_eligibility: float = 0.40,
        w2_relevance: float = 0.35,
        w3_preference: float = 0.15,
        w4_freshness: float = 0.10,
    ):
        self.w1 = w1_eligibility
        self.w2 = w2_relevance
        self.w3 = w3_preference
        self.w4 = w4_freshness

    def calculate_skill_overlap(
        self, user_skills: List[str], required_skills: List[str]
    ) -> tuple[float, List[str], List[str]]:
        user_set: Set[str] = {s.strip().lower() for s in user_skills if s}
        req_set: Set[str] = {s.strip().lower() for s in required_skills if s}

        if not req_set:
            return 1.0, list(user_skills), []

        matched = user_set.intersection(req_set)
        missing = req_set - user_set

        overlap_ratio = len(matched) / len(req_set)

        matching_skills = [s for s in user_skills if s.strip().lower() in matched]
        missing_skills = [s for s in required_skills if s.strip().lower() in missing]

        return overlap_ratio, matching_skills, missing_skills

    def score_opportunity(
        self,
        opportunity: Dict[str, Any],
        user_profile: Dict[str, Any],
    ) -> ScoredMatch:
        user_skills = user_profile.get("skills", [])
        req_skills = opportunity.get("required_skills", [])
        relevance_ratio, matched_skills, missing_skills = self.calculate_skill_overlap(
            user_skills, req_skills
        )

        # 1. Eligibility Check (Hard constraint)
        is_eligible = True
        eligibility_score = 1.0
        opp_eligibility = opportunity.get("eligibility", {})
        allowed_education = opp_eligibility.get("education_level", [])
        user_education = user_profile.get("education_level")

        if allowed_education and user_education:
            if isinstance(allowed_education, list) and user_education.lower() not in [e.lower() for e in allowed_education]:
                is_eligible = False
                eligibility_score = 0.0

        # 2. Preference match (e.g. location, type)
        preference_score = 0.8
        user_location = user_profile.get("state_code", "").lower()
        opp_location = opportunity.get("location", "").lower()
        if "remote" in opp_location or (user_location and user_location in opp_location):
            preference_score = 1.0

        # 3. Freshness / Source Reliability
        freshness_score = 0.95 if opportunity.get("status") == "active" else 0.5

        # Hard Gate: If mandatory eligibility fails, final score is 0
        if not is_eligible:
            final_score = 0.0
            explanation = "Does not meet mandatory education level requirements."
        else:
            raw_score = (
                (self.w1 * eligibility_score)
                + (self.w2 * relevance_ratio)
                + (self.w3 * preference_score)
                + (self.w4 * freshness_score)
            )
            final_score = round(raw_score * 100, 1)
            explanation = f"Matches {len(matched_skills)} of {len(req_skills)} required skills ({round(relevance_ratio*100)}% fit)."

        return ScoredMatch(
            item_id=str(opportunity.get("id")),
            title=opportunity.get("title", ""),
            final_score=final_score,
            eligibility_score=eligibility_score,
            relevance_score=relevance_ratio,
            preference_score=preference_score,
            freshness_score=freshness_score,
            is_eligible=is_eligible,
            matching_skills=matched_skills,
            missing_skills=missing_skills,
            explanation=explanation,
        )
