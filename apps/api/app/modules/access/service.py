from typing import Dict, Any, List
from app.modules.access.repository import DocumentRepository
from app.intelligence.orchestrator.orchestrator import AIOrchestrator
from app.intelligence.rag.chunker import StructureAwareChunker
from app.core.exceptions import DocumentNotFoundError

class AccessService:
    def __init__(self, orchestrator: AIOrchestrator, repository: DocumentRepository):
        self.orchestrator = orchestrator
        self.repository = repository
        self.chunker = StructureAwareChunker()

    def process_document_upload(
        self,
        user_id: str,
        filename: str,
        content: str,
        mime_type: str = "text/plain",
    ) -> Dict[str, Any]:
        # Create document
        doc = self.repository.create_document(
            user_id=user_id,
            filename=filename,
            storage_path=f"uploads/{user_id}/{filename}",
            mime_type=mime_type,
            extracted_text=content,
            page_count=max(1, len(content) // 1500),
        )

        # Chunk text
        chunks = self.chunker.chunk_text(content)
        chunk_dicts = [
            {
                "document_id": doc["id"],
                "chunk_index": c.chunk_index,
                "content": c.content,
                "page_number": c.page_number,
            }
            for c in chunks
        ]
        self.repository.save_chunks(doc["id"], chunk_dicts)
        return doc

    async def ask_document(
        self,
        user_id: str,
        document_id: str,
        question: str,
        language: str = "en",
    ) -> Dict[str, Any]:
        doc = self.repository.get_document(document_id, user_id)
        if not doc:
            raise DocumentNotFoundError(document_id)

        chunks = self.repository.get_document_chunks(document_id, user_id)
        return await self.orchestrator.ask_document(
            document_id=document_id,
            question=question,
            chunks=chunks,
            target_language=language,
        )

    async def simplify_text(self, text: str, language: str = "en") -> str:
        return await self.orchestrator.simplify_text(text, target_language=language)
