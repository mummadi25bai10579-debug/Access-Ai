from typing import Dict, Any, List, Optional

_SCHEMES_STORE: Dict[str, Dict[str, Any]] = {
    "s1000000-0000-0000-0000-000000000001": {
        "id": "s1000000-0000-0000-0000-000000000001",
        "name": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
        "description": "Financial support of ₹6,000 per year in three installments for landholding farmer families.",
        "official_url": "https://pmkisan.gov.in",
        "state_code": None,
        "required_documents": ["Aadhaar Card", "Land Ownership Record", "Bank Passbook"],
        "status": "active",
        "rules": [
            {
                "rule_key": "category",
                "operator": "==",
                "expected_value": "farmer",
                "is_mandatory": True,
                "description": "Citizen must be registered as a farmer",
            }
        ],
    },
    "s1000000-0000-0000-0000-000000000002": {
        "id": "s1000000-0000-0000-0000-000000000002",
        "name": "Jagananna Vidya Deevena (RTF)",
        "description": "Full fee reimbursement for Polytechnic, Degree, Engineering, and Post-Graduate students.",
        "official_url": "https://jnanabhumi.ap.gov.in",
        "state_code": "AP",
        "required_documents": ["Caste Certificate", "Income Certificate", "Student Aadhaar", "Mother Aadhaar & Bank Details"],
        "status": "active",
        "rules": [
            {
                "rule_key": "state_code",
                "operator": "==",
                "expected_value": "AP",
                "is_mandatory": True,
                "description": "Resident of Andhra Pradesh",
            },
            {
                "rule_key": "annual_family_income",
                "operator": "<=",
                "expected_value": 250000,
                "is_mandatory": True,
                "description": "Family income not exceeding ₹2,50,000",
            },
            {
                "rule_key": "education_level",
                "operator": "in",
                "expected_value": ["diploma", "undergraduate", "postgraduate"],
                "is_mandatory": True,
                "description": "Enrolled in higher education",
            },
        ],
    },
    "s1000000-0000-0000-0000-000000000004": {
        "id": "s1000000-0000-0000-0000-000000000004",
        "name": "AICTE Pragati Scholarship for Girl Students",
        "description": "₹50,000 per annum scholarship for girl students admitted to technical degree or diploma courses.",
        "official_url": "https://www.aicte-india.org",
        "state_code": None,
        "required_documents": ["10th/12th Marksheet", "Admission Allotment Letter", "Income Certificate"],
        "status": "active",
        "rules": [
            {
                "rule_key": "gender",
                "operator": "==",
                "expected_value": "female",
                "is_mandatory": True,
                "description": "Applicant must be female",
            },
            {
                "rule_key": "annual_family_income",
                "operator": "<=",
                "expected_value": 800000,
                "is_mandatory": True,
                "description": "Family income not exceeding ₹8,00,000",
            },
        ],
    },
}

class SchemeRepository:
    def list_schemes(self, state_code: Optional[str] = None) -> List[Dict[str, Any]]:
        schemes = list(_SCHEMES_STORE.values())
        if state_code:
            return [s for s in schemes if s.get("state_code") is None or s.get("state_code") == state_code]
        return schemes

    def get_scheme(self, scheme_id: str) -> Optional[Dict[str, Any]]:
        return _SCHEMES_STORE.get(scheme_id)
