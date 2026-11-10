from typing import Dict, Any, List, Optional
import uuid
from app.core.logging import get_logger
from app.database.models.document import DocumentModel, DocumentChunkModel
from app.database.models.profile import ProfileModel

logger = get_logger(__name__)

# Test fixture fallback store for offline tests
_TEST_DOCUMENTS_STORE: Dict[str, Dict[str, Any]] = {}
_TEST_CHUNKS_STORE: Dict[str, List[Dict[str, Any]]] = {}


class DocumentRepository:
    def __init__(self, db: Optional[Any] = None):
        self.db = db

    def _resolve_profile_id(self, user_id: str) -> Optional[uuid.UUID]:
        """Resolves user_id (which may be a Clerk ID or a UUID) to a profiles.id UUID."""
        if not self.db:
            return None
        try:
            # Check if user_id is already a valid UUID
            return uuid.UUID(str(user_id))
        except ValueError:
            pass

        # Otherwise look up by clerk_user_id
        profile = self.db.query(ProfileModel).filter(ProfileModel.clerk_user_id == user_id).first()
        if profile:
            return profile.id
        # Create profile record if it doesn't exist yet
        new_prof = ProfileModel(
            clerk_user_id=user_id,
            email=f"{user_id}@accessai.local",
            full_name="Citizen",
        )
        self.db.add(new_prof)
        self.db.commit()
        self.db.refresh(new_prof)
        return new_prof.id

    def create_document(
        self,
        user_id: str,
        filename: str,
        storage_path: str,
        mime_type: str,
        extracted_text: Optional[str] = None,
        page_count: int = 1,
        status: str = "processing",
    ) -> Dict[str, Any]:
        if self.db:
            try:
                prof_id = self._resolve_profile_id(user_id)
                doc = DocumentModel(
                    user_id=prof_id,
                    filename=filename,
                    storage_path=storage_path,
                    mime_type=mime_type,
                    status=status,
                    detected_language="en",
                    extracted_text=extracted_text or "",
                    page_count=page_count,
                )
                self.db.add(doc)
                self.db.commit()
                self.db.refresh(doc)
                return doc.to_dict()
            except Exception as e:
                self.db.rollback()
                logger.error(f"Failed to create document in database: {e}")

        # Fallback for unit tests without database connection
        doc_id = str(uuid.uuid4())
        doc_dict = {
            "id": doc_id,
            "user_id": user_id,
            "filename": filename,
            "storage_path": storage_path,
            "mime_type": mime_type,
            "status": status,
            "detected_language": "en",
            "extracted_text": extracted_text or "",
            "page_count": page_count,
        }
        _TEST_DOCUMENTS_STORE[doc_id] = doc_dict
        return doc_dict

    def update_document_status(
        self,
        document_id: str,
        user_id: str,
        status: str,
        error_message: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Updates document status and logs error if any, ensuring tenant ownership."""
        if self.db:
            try:
                prof_id = self._resolve_profile_id(user_id)
                doc_uuid = uuid.UUID(str(document_id))
                query = self.db.query(DocumentModel).filter(DocumentModel.id == doc_uuid)
                if prof_id:
                    query = query.filter(DocumentModel.user_id == prof_id)
                doc = query.first()
                if doc:
                    doc.status = status
                    if error_message:
                        meta = dict(doc.metadata_ or {})
                        meta["processing_error"] = str(error_message)[:500]
                        doc.metadata_ = meta
                    self.db.commit()
                    self.db.refresh(doc)
                    return doc.to_dict()
                return None
            except Exception as e:
                self.db.rollback()
                logger.error(f"Failed to update document status: {e}")
                raise

        doc = self.get_document(document_id, user_id)
        if doc:
            doc["status"] = status
            if error_message:
                doc.setdefault("metadata", {})["processing_error"] = str(error_message)[:500]
            _TEST_DOCUMENTS_STORE[document_id] = doc
            return doc
        return None

    def get_document(self, document_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        if self.db:
            try:
                prof_id = self._resolve_profile_id(user_id)
                doc_uuid = uuid.UUID(str(document_id))
                query = self.db.query(DocumentModel).filter(DocumentModel.id == doc_uuid)
                if prof_id:
                    query = query.filter(DocumentModel.user_id == prof_id)
                doc = query.first()
                if doc:
                    return doc.to_dict()
            except Exception as e:
                logger.warning(f"Failed to retrieve document from database: {e}")

        doc = _TEST_DOCUMENTS_STORE.get(document_id)
        if doc and str(doc.get("user_id")) == str(user_id):
            return doc
        return None

    def list_user_documents(self, user_id: str) -> List[Dict[str, Any]]:
        if self.db:
            try:
                prof_id = self._resolve_profile_id(user_id)
                if prof_id:
                    docs = (
                        self.db.query(DocumentModel)
                        .filter(DocumentModel.user_id == prof_id)
                        .order_by(DocumentModel.created_at.desc())
                        .all()
                    )
                    return [d.to_dict() for d in docs]
            except Exception as e:
                logger.warning(f"Failed to list documents from database: {e}")

        return [doc for doc in _TEST_DOCUMENTS_STORE.values() if str(doc.get("user_id")) == str(user_id)]

    def delete_document(self, document_id: str, user_id: str) -> bool:
        if self.db:
            try:
                prof_id = self._resolve_profile_id(user_id)
                doc_uuid = uuid.UUID(str(document_id))
                query = self.db.query(DocumentModel).filter(DocumentModel.id == doc_uuid)
                if prof_id:
                    query = query.filter(DocumentModel.user_id == prof_id)
                doc = query.first()
                if doc:
                    self.db.delete(doc)
                    self.db.commit()
                    return True
                return False
            except Exception as e:
                self.db.rollback()
                logger.error(f"Failed to delete document from database: {e}")

        doc = self.get_document(document_id, user_id)
        if doc:
            _TEST_DOCUMENTS_STORE.pop(document_id, None)
            _TEST_CHUNKS_STORE.pop(document_id, None)
            return True
        return False

    def save_chunks(
        self,
        document_id: str,
        chunks: List[Dict[str, Any]],
        user_id: Optional[str] = None,
    ) -> None:
        """
        Persists chunks idempotently: removes existing chunks for this document before adding new ones.
        Enforces tenant scoping (GAP-2) and uses row-level locking (GAP-1) to prevent concurrent races.
        """
        if self.db:
            try:
                doc_uuid = uuid.UUID(str(document_id))
                query = self.db.query(DocumentModel).filter(DocumentModel.id == doc_uuid)
                if user_id:
                    prof_id = self._resolve_profile_id(user_id)
                    if prof_id:
                        query = query.filter(DocumentModel.user_id == prof_id)

                # Row-level lock to prevent concurrent ingestion races (GAP-1)
                try:
                    if self.db.bind and self.db.bind.dialect.name == "postgresql":
                        query = query.with_for_update()
                except Exception:
                    pass

                doc = query.first()
                if doc:
                    # Idempotent cleanup: delete old chunks for this document
                    self.db.query(DocumentChunkModel).filter(DocumentChunkModel.document_id == doc.id).delete()
                    for i, c in enumerate(chunks):
                        chunk_model = DocumentChunkModel(
                            document_id=doc.id,
                            user_id=doc.user_id,
                            chunk_index=c.get("chunk_index", i),
                            content=c.get("content", ""),
                            embedding=c.get("embedding"),
                            page_number=c.get("page_number", 1),
                            language=c.get("language", "en"),
                        )
                        self.db.add(chunk_model)
                    self.db.commit()
                    return
                elif user_id:
                    logger.warning(f"save_chunks: document {document_id} not found for user {user_id}")
                    return
            except Exception as e:
                self.db.rollback()
                logger.error(f"Failed to persist document chunks: {e}")
                raise

        # Idempotent in-memory overwrite with tenant check (GAP-2)
        if user_id:
            existing = self.get_document(document_id, user_id)
            if not existing:
                logger.warning(f"save_chunks: document {document_id} not found for user {user_id} in memory store")
                return

        _TEST_CHUNKS_STORE[document_id] = list(chunks)

    def search_chunks(
        self,
        document_id: str,
        user_id: str,
        query_embedding: Optional[List[float]] = None,
        limit: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves the top-k most relevant document chunks using pgvector cosine distance.
        Enforces user ownership isolation at the query level.
        """
        if self.db:
            try:
                prof_id = self._resolve_profile_id(user_id)
                doc_uuid = uuid.UUID(str(document_id))
                query = (
                    self.db.query(DocumentChunkModel)
                    .filter(DocumentChunkModel.document_id == doc_uuid)
                )
                if prof_id:
                    query = query.filter(DocumentChunkModel.user_id == prof_id)

                if query_embedding and len(query_embedding) == 384:
                    chunks = (
                        query.order_by(DocumentChunkModel.embedding.cosine_distance(query_embedding))
                        .limit(limit)
                        .all()
                    )
                else:
                    chunks = query.order_by(DocumentChunkModel.chunk_index.asc()).limit(limit).all()

                if chunks:
                    return [c.to_dict() for c in chunks]
            except Exception as e:
                logger.warning(f"Failed to search document chunks with vectors: {e}")

        chunks = _TEST_CHUNKS_STORE.get(document_id, [])
        return chunks[:limit] if chunks else []

    def get_document_chunks(self, document_id: str, user_id: str) -> List[Dict[str, Any]]:
        if self.db:
            try:
                prof_id = self._resolve_profile_id(user_id)
                doc_uuid = uuid.UUID(str(document_id))
                query = (
                    self.db.query(DocumentChunkModel)
                    .filter(DocumentChunkModel.document_id == doc_uuid)
                )
                if prof_id:
                    query = query.filter(DocumentChunkModel.user_id == prof_id)
                chunks = query.order_by(DocumentChunkModel.chunk_index.asc()).all()
                if chunks:
                    return [c.to_dict() for c in chunks]
            except Exception as e:
                logger.warning(f"Failed to get document chunks from database: {e}")

        doc = self.get_document(document_id, user_id)
        if not doc:
            return []
        return _TEST_CHUNKS_STORE.get(document_id, [])
