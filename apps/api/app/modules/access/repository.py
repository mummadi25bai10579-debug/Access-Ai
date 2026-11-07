from typing import Dict, Any, List, Optional
import uuid

# Fast in-memory store for documents & chunks with user isolation (interchangeable with PostgreSQL)
_DOCUMENTS_STORE: Dict[str, Dict[str, Any]] = {}
_CHUNKS_STORE: Dict[str, List[Dict[str, Any]]] = {}

class DocumentRepository:
    def create_document(
        self,
        user_id: str,
        filename: str,
        storage_path: str,
        mime_type: str,
        extracted_text: Optional[str] = None,
        page_count: int = 1,
    ) -> Dict[str, Any]:
        doc_id = str(uuid.uuid4())
        doc = {
            "id": doc_id,
            "user_id": user_id,
            "filename": filename,
            "storage_path": storage_path,
            "mime_type": mime_type,
            "status": "completed" if extracted_text else "uploaded",
            "detected_language": "en",
            "extracted_text": extracted_text or "",
            "page_count": page_count,
        }
        _DOCUMENTS_STORE[doc_id] = doc
        return doc

    def get_document(self, document_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        doc = _DOCUMENTS_STORE.get(document_id)
        if doc and str(doc.get("user_id")) == str(user_id):
            return doc
        return None

    def list_user_documents(self, user_id: str) -> List[Dict[str, Any]]:
        return [doc for doc in _DOCUMENTS_STORE.values() if str(doc.get("user_id")) == str(user_id)]

    def delete_document(self, document_id: str, user_id: str) -> bool:
        doc = self.get_document(document_id, user_id)
        if doc:
            del _DOCUMENTS_STORE[document_id]
            _CHUNKS_STORE.pop(document_id, None)
            return True
        return False

    def save_chunks(self, document_id: str, chunks: List[Dict[str, Any]]) -> None:
        _CHUNKS_STORE[document_id] = chunks

    def get_document_chunks(self, document_id: str, user_id: str) -> List[Dict[str, Any]]:
        doc = self.get_document(document_id, user_id)
        if not doc:
            return []
        return _CHUNKS_STORE.get(document_id, [])
