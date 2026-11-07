from fastapi import APIRouter
from app.api.v1.users import router as users_router
from app.api.v1.documents import router as documents_router
from app.api.v1.access import router as access_router
from app.api.v1.education import router as education_router
from app.api.v1.schemes import router as schemes_router
from app.api.v1.opportunities import router as opportunities_router
from app.api.v1.voice import router as voice_router

api_v1_router = APIRouter()

api_v1_router.include_router(users_router, prefix="/users", tags=["Users & Preferences"])
api_v1_router.include_router(documents_router, prefix="/documents", tags=["Documents & Ingestion"])
api_v1_router.include_router(access_router, prefix="/access", tags=["Module 01: AccessAI Intelligence"])
api_v1_router.include_router(education_router, prefix="/education", tags=["Module 02: EduBridge"])
api_v1_router.include_router(schemes_router, prefix="/schemes", tags=["Module 03: SchemeConnect"])
api_v1_router.include_router(opportunities_router, prefix="/opportunities", tags=["Module 04: OpportunityBridge"])
api_v1_router.include_router(voice_router, prefix="/voice", tags=["Voice & Accessibility"])
