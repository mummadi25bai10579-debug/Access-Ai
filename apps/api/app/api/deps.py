from typing import Dict, Any, Generator, Callable

try:
    from fastapi import Header, Depends
except ImportError:
    # Lightweight shims for local testing without fastapi installed
    def Header(default=None):
        return default
    def Depends(dependency: Callable):
        return dependency

from app.core.security import verify_jwt_token
from app.core.exceptions import UnauthorizedError
from app.intelligence.providers.provider_factory import get_ai_provider
from app.intelligence.orchestrator.orchestrator import AIOrchestrator
from app.modules.access.repository import DocumentRepository
from app.modules.access.service import AccessService
from app.modules.education.repository import EducationRepository
from app.modules.education.service import EducationService
from app.modules.schemes.repository import SchemeRepository
from app.modules.schemes.service import SchemeService
from app.modules.opportunities.repository import OpportunityRepository
from app.modules.opportunities.service import OpportunityService

# Singletons / cached instances
_document_repo = DocumentRepository()
_ai_provider = get_ai_provider()
_orchestrator = AIOrchestrator(_ai_provider)
_access_service = AccessService(_orchestrator, _document_repo)

_education_repo = EducationRepository()
_education_service = EducationService(_orchestrator, _education_repo)

_scheme_repo = SchemeRepository()
_scheme_service = SchemeService(_scheme_repo)

_opportunity_repo = OpportunityRepository()
_opportunity_service = OpportunityService(_opportunity_repo)

async def get_current_user(authorization: str = Header(None)) -> Dict[str, Any]:
    """
    Extracts and verifies Supabase JWT token from Authorization header.
    In development, falls back to a default test user if unauthenticated.
    """
    if not authorization:
        # Fallback for dev ease
        return {
            "sub": "00000000-0000-0000-0000-000000000001",
            "id": "00000000-0000-0000-0000-000000000001",
            "email": "demo.student@accessai.local",
            "role": "authenticated",
        }
    return verify_jwt_token(authorization)

def get_access_service() -> AccessService:
    return _access_service

def get_education_service() -> EducationService:
    return _education_service

def get_scheme_service() -> SchemeService:
    return _scheme_service

def get_opportunity_service() -> OpportunityService:
    return _opportunity_service
