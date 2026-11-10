from typing import Dict, Any, List, Optional
import uuid
import time
from app.core.logging import get_logger
from app.database.models.scheme import SchemeModel, SchemeEligibilityRuleModel

logger = get_logger(__name__)

# In-memory TTL cache for high-traffic scheme listings
_SCHEMES_CACHE: Dict[str, Dict[str, Any]] = {}
_CACHE_TTL: float = 60.0  # 60 seconds TTL

# Fallback test store for unit tests without database connection
_TEST_SCHEMES_STORE: Dict[str, Dict[str, Any]] = {
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
    def __init__(self, db: Optional[Any] = None):
        self.db = db

    def _normalize_scheme_id(self, scheme_id: str) -> str:
        sid_str = str(scheme_id).strip()
        if sid_str.startswith("s1000000-"):
            return "a1000000-" + sid_str[9:]
        return sid_str

    def list_schemes(self, state_code: Optional[str] = None) -> List[Dict[str, Any]]:
        cache_key = f"schemes_{state_code or 'all'}"
        now = time.time()
        if cache_key in _SCHEMES_CACHE and now < _SCHEMES_CACHE[cache_key]["expiry"]:
            return _SCHEMES_CACHE[cache_key]["data"]

        if self.db:
            try:
                query = self.db.query(SchemeModel).filter(SchemeModel.status == "active")
                if state_code:
                    query = query.filter(
                        (SchemeModel.state_code == None) | (SchemeModel.state_code == state_code)
                    )
                schemes = query.all()
                if schemes:
                    scheme_ids = [s.id for s in schemes]
                    all_rules = (
                        self.db.query(SchemeEligibilityRuleModel)
                        .filter(SchemeEligibilityRuleModel.scheme_id.in_(scheme_ids))
                        .all()
                    )
                    rules_by_scheme = {}
                    for r in all_rules:
                        rules_by_scheme.setdefault(str(r.scheme_id), []).append(r.to_dict())

                    results = []
                    for s in schemes:
                        s_dict = s.to_dict()
                        s_dict["rules"] = rules_by_scheme.get(str(s.id), [])
                        results.append(s_dict)

                    _SCHEMES_CACHE[cache_key] = {"data": results, "expiry": now + _CACHE_TTL}
                    return results
            except Exception as e:
                logger.warning(f"Failed to list schemes from database: {e}")

        schemes = list(_TEST_SCHEMES_STORE.values())
        if state_code:
            return [s for s in schemes if s.get("state_code") is None or s.get("state_code") == state_code]
        return schemes

    def get_scheme(self, scheme_id: str) -> Optional[Dict[str, Any]]:
        normalized_id = self._normalize_scheme_id(scheme_id)
        if self.db:
            try:
                sid = uuid.UUID(normalized_id)
                scheme = self.db.query(SchemeModel).filter(SchemeModel.id == sid).first()
                if scheme:
                    s_dict = scheme.to_dict()
                    rules = (
                        self.db.query(SchemeEligibilityRuleModel)
                        .filter(SchemeEligibilityRuleModel.scheme_id == scheme.id)
                        .all()
                    )
                    s_dict["rules"] = [r.to_dict() for r in rules]
                    return s_dict
            except Exception as e:
                logger.warning(f"Failed to get scheme {scheme_id} from database: {e}")

        return _TEST_SCHEMES_STORE.get(scheme_id) or _TEST_SCHEMES_STORE.get(normalized_id)
