from typing import Dict, Any, Generator, Callable, Optional

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
from app.database.session import get_db

# Singletons / cached fallback instances for unit tests
_document_repo = DocumentRepository()
_orchestrator: Optional[AIOrchestrator] = None

def get_orchestrator() -> AIOrchestrator:
    global _orchestrator
    if _orchestrator is None:
        provider = get_ai_provider()
        _orchestrator = AIOrchestrator(provider)
    return _orchestrator

def set_orchestrator(orch: AIOrchestrator) -> None:
    global _orchestrator
    _orchestrator = orch

_education_repo = EducationRepository()
_scheme_repo = SchemeRepository()
_opportunity_repo = OpportunityRepository()


async def get_current_user(authorization: str = Header(None)) -> Dict[str, Any]:
    """
    FastAPI Dependency: Extracts and verifies Clerk session JWT token from Authorization header.
    Enforces signature verification, algorithm RS256, expiration check, and extracts Clerk user ID ('sub').
    Rejects missing or invalid tokens with HTTP 401 UnauthorizedError.
    """
    if not authorization:
        raise UnauthorizedError("Authentication required: Missing Authorization header.")
    return verify_jwt_token(authorization)


def get_document_repo(db: Any = Depends(get_db)) -> DocumentRepository:
    if db is not None:
        return DocumentRepository(db)
    return _document_repo


def get_access_service(repo: Any = Depends(get_document_repo)) -> AccessService:
    if not isinstance(repo, DocumentRepository):
        repo = _document_repo
    return AccessService(get_orchestrator(), repo)


def get_education_repo(db: Any = Depends(get_db)) -> EducationRepository:
    if db is not None:
        return EducationRepository(db)
    return _education_repo


def get_education_service(repo: Any = Depends(get_education_repo)) -> EducationService:
    if not isinstance(repo, EducationRepository):
        repo = _education_repo
    return EducationService(get_orchestrator(), repo)


def get_scheme_repo(db: Any = Depends(get_db)) -> SchemeRepository:
    if db is not None:
        return SchemeRepository(db)
    return _scheme_repo


def get_scheme_service(repo: Any = Depends(get_scheme_repo)) -> SchemeService:
    if not isinstance(repo, SchemeRepository):
        repo = _scheme_repo
    return SchemeService(repo)


def get_opportunity_repo(db: Any = Depends(get_db)) -> OpportunityRepository:
    if db is not None:
        return OpportunityRepository(db)
    return _opportunity_repo


def get_opportunity_service(repo: Any = Depends(get_opportunity_repo)) -> OpportunityService:
    if not isinstance(repo, OpportunityRepository):
        repo = _opportunity_repo
    return OpportunityService(repo)
