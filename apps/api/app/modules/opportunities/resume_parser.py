import re
from typing import Dict, Any, List

KNOWN_SKILLS = [
    "Python", "JavaScript", "TypeScript", "React", "Next.js", "FastAPI",
    "PostgreSQL", "SQL", "Docker", "Git", "Machine Learning", "PyTorch",
    "Tailwind CSS", "HTML", "CSS", "REST APIs", "Node.js", "Linux",
]

class ResumeParser:
    """
    Extracts structured skills and educational qualifications from resume text.
    """

    def parse_text(self, text: str) -> Dict[str, Any]:
        text_lower = text.lower()
        extracted_skills: List[str] = []

        for skill in KNOWN_SKILLS:
            # Word boundary matching
            pattern = r'\b' + re.escape(skill.lower()) + r'\b'
            if re.search(pattern, text_lower):
                extracted_skills.append(skill)

        # Detect education level
        education_level = "undergraduate"
        if "master" in text_lower or "m.tech" in text_lower or "m.sc" in text_lower:
            education_level = "graduate"
        elif "phd" in text_lower or "doctorate" in text_lower:
            education_level = "doctorate"
        elif "diploma" in text_lower or "polytechnic" in text_lower:
            education_level = "diploma"

        return {
            "skills": extracted_skills,
            "education_level": education_level,
            "summary": f"Detected {len(extracted_skills)} technical skills with {education_level} background.",
        }
