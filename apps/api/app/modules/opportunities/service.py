from typing import Dict, Any, List, Optional
from app.modules.opportunities.repository import OpportunityRepository
from app.modules.opportunities.resume_parser import ResumeParser
from app.intelligence.recommendations.engine import RecommendationEngine
from app.core.exceptions import OpportunityNotFoundError

class OpportunityService:
    def __init__(self, repository: OpportunityRepository):
        self.repository = repository
        self.parser = ResumeParser()
        self.recommender = RecommendationEngine()

    def list_opportunities(self, opp_type: Optional[str] = None) -> List[Dict[str, Any]]:
        return self.repository.list_opportunities(opportunity_type=opp_type)

    def get_opportunity(self, opp_id: str) -> Dict[str, Any]:
        opp = self.repository.get_opportunity(opp_id)
        if not opp:
            raise OpportunityNotFoundError(opp_id)
        return opp

    def match_opportunities(
        self, profile: Dict[str, Any], filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        opps = self.repository.list_opportunities()
        scored_matches = []

        for opp in opps:
            scored = self.recommender.score_opportunity(opp, profile)
            scored_matches.append({
                "opportunity_id": scored.item_id,
                "title": scored.title,
                "organization": opp.get("organization", ""),
                "match_score": scored.final_score,
                "matching_skills": scored.matching_skills,
                "missing_skills": scored.missing_skills,
                "eligibility_status": "eligible" if scored.is_eligible else "not_eligible",
                "deadline": opp.get("deadline"),
                "source_verified": True,
                "official_url": opp.get("official_url", ""),
                "explanation": scored.explanation,
            })

        # Rank descending by match_score
        scored_matches.sort(key=lambda x: x["match_score"], reverse=True)
        return scored_matches

    def analyze_resume(self, resume_text: str) -> Dict[str, Any]:
        return self.parser.parse_text(resume_text)

    def calculate_skill_gap(self, opportunity_id: str, user_skills: List[str]) -> Dict[str, Any]:
        opp = self.get_opportunity(opportunity_id)
        _, matched, missing = self.recommender.calculate_skill_overlap(
            user_skills, opp.get("required_skills", [])
        )
        return {
            "opportunity_id": opportunity_id,
            "matching_skills": matched,
            "missing_skills": missing,
            "recommended_learning_topics": [f"Master {skill} with EduBridge" for skill in missing],
        }
