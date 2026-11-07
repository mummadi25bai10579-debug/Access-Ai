from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from app.api.deps import get_current_user, get_access_service
from app.modules.access.service import AccessService
from app.modules.access.schemas import AskQuestionRequest, SimplifyTextRequest, TranslateTextRequest

router = APIRouter()

@router.post("/ask")
async def ask_document(
    body: AskQuestionRequest,
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user),
    service: AccessService = Depends(get_access_service),
):
    result = await service.ask_document(
        user_id=user["id"],
        document_id=body.document_id,
        question=body.question,
        language=body.language,
    )
    return {
        "success": True,
        "data": result,
        "request_id": getattr(request.state, "request_id", "req-id"),
    }

@router.post("/simplify")
async def simplify_text(
    body: SimplifyTextRequest,
    request: Request,
    service: AccessService = Depends(get_access_service),
):
    simplified = await service.simplify_text(body.text, language=body.language)
    return {
        "success": True,
        "data": {"simplified_text": simplified, "language": body.language},
        "request_id": getattr(request.state, "request_id", "req-id"),
    }

@router.post("/translate")
async def translate_text(
    body: TranslateTextRequest,
    request: Request,
    service: AccessService = Depends(get_access_service),
):
    translated = await service.orchestrator.provider.generate(
        f"Translate the following text into {body.target_language}:\n\n{body.text}"
    )
    return {
        "success": True,
        "data": {"translated_text": translated, "target_language": body.target_language},
        "request_id": getattr(request.state, "request_id", "req-id"),
    }

@router.post("/describe-image")
async def describe_image(
    request: Request,
    body: Dict[str, Any],
    service: AccessService = Depends(get_access_service),
):
    return {
        "success": True,
        "data": {
            "caption": "An official government circular with emblem at the header and application date highlighted.",
            "extracted_text": "Government of India Notification - Scheme Guidelines",
        },
        "request_id": getattr(request.state, "request_id", "req-id"),
    }
