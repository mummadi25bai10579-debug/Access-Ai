from typing import Dict, Any, List, Optional

_OPPORTUNITIES_STORE: Dict[str, Dict[str, Any]] = {
    "o1000000-0000-0000-0000-000000000001": {
        "id": "o1000000-0000-0000-0000-000000000001",
        "title": "AI & Full-Stack Engineering Internship",
        "organization": "AssistiveTech Labs India",
        "opportunity_type": "internship",
        "location": "Remote (India)",
        "official_url": "https://example.com/careers/ai-intern",
        "required_skills": ["Python", "FastAPI", "React", "TypeScript", "Tailwind CSS"],
        "eligibility": {"education_level": ["undergraduate", "graduate"]},
        "deadline": "2026-11-25T23:59:59Z",
        "status": "active",
    },
    "o1000000-0000-0000-0000-000000000002": {
        "id": "o1000000-0000-0000-0000-000000000002",
        "title": "Digital India AI Hackathon 2026",
        "organization": "MeitY",
        "opportunity_type": "hackathon",
        "location": "Hybrid / New Delhi",
        "official_url": "https://innovateindia.mygov.in",
        "required_skills": ["Machine Learning", "Python", "Speech Recognition", "OpenAPI"],
        "eligibility": {},
        "deadline": "2026-12-05T23:59:59Z",
        "status": "active",
    },
    "o1000000-0000-0000-0000-000000000003": {
        "id": "o1000000-0000-0000-0000-000000000003",
        "title": "Junior Cloud & Backend Engineer",
        "organization": "Bharat Cloud Solutions",
        "opportunity_type": "job",
        "location": "Hyderabad / Bengaluru",
        "official_url": "https://example.com/careers/junior-backend",
        "required_skills": ["Python", "PostgreSQL", "Docker", "REST APIs", "Git"],
        "eligibility": {"education_level": ["undergraduate", "graduate"]},
        "deadline": "2026-11-30T23:59:59Z",
        "status": "active",
    },
}

class OpportunityRepository:
    def list_opportunities(
        self, opportunity_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        opps = list(_OPPORTUNITIES_STORE.values())
        if opportunity_type:
            return [o for o in opps if o.get("opportunity_type") == opportunity_type]
        return opps

    def get_opportunity(self, opportunity_id: str) -> Optional[Dict[str, Any]]:
        return _OPPORTUNITIES_STORE.get(opportunity_id)
