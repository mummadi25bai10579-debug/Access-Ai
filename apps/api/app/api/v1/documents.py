from fastapi import APIRouter, Depends, UploadFile, File, Form, Request
from typing import Dict, Any, Optional
from app.api.deps import get_current_user, get_access_service
from app.modules.access.service import AccessService

router = APIRouter()

@router.post("/upload")
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    language: str = Form("en"),
    processing_mode: str = Form("full"),
    user: Dict[str, Any] = Depends(get_current_user),
    service: AccessService = Depends(get_access_service),
):
    content_bytes = await file.read()
    text_content = content_bytes.decode("utf-8", errors="ignore")

    doc = service.process_document_upload(
        user_id=user["id"],
        filename=file.filename or "uploaded_doc.txt",
        content=text_content,
        mime_type=file.content_type or "text/plain",
    )

    return {
        "success": True,
        "data": {
            "document_id": doc["id"],
            "filename": doc["filename"],
            "status": doc["status"],
            "page_count": doc["page_count"],
            "message": "Document uploaded and indexed successfully.",
        },
        "request_id": getattr(request.state, "request_id", "req-id"),
    }

@router.get("")
async def list_documents(
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user),
    service: AccessService = Depends(get_access_service),
):
    docs = service.repository.list_user_documents(user["id"])
    return {
        "success": True,
        "data": docs,
        "request_id": getattr(request.state, "request_id", "req-id"),
    }

@router.get("/{document_id}")
async def get_document(
    document_id: str,
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user),
    service: AccessService = Depends(get_access_service),
):
    doc = service.repository.get_document(document_id, user["id"])
    if not doc:
        return {
            "success": False,
            "error": {"code": "DOCUMENT_NOT_FOUND", "message": "Document not found."},
            "request_id": getattr(request.state, "request_id", "req-id"),
        }
    return {
        "success": True,
        "data": doc,
        "request_id": getattr(request.state, "request_id", "req-id"),
    }

@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    request: Request,
    user: Dict[str, Any] = Depends(get_current_user),
    service: AccessService = Depends(get_access_service),
):
    success = service.repository.delete_document(document_id, user["id"])
    return {
        "success": success,
        "data": {"deleted": success},
        "request_id": getattr(request.state, "request_id", "req-id"),
    }
