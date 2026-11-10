import logging
from typing import Dict, Any, List, Optional
from app.modules.access.repository import DocumentRepository
from app.intelligence.orchestrator.orchestrator import AIOrchestrator
from app.intelligence.rag.chunker import StructureAwareChunker
from app.core.exceptions import DocumentNotFoundError

logger = logging.getLogger(__name__)

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
        page_count: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Synchronous document creation and chunk storage."""
        calc_page_count = page_count or max(1, len(content) // 1500)
        doc = self.repository.create_document(
            user_id=user_id,
            filename=filename,
            storage_path=f"uploads/{user_id}/{filename}",
            mime_type=mime_type,
            extracted_text=content,
            page_count=calc_page_count,
            status="processing",
        )

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
        self.repository.save_chunks(doc["id"], chunk_dicts, user_id=user_id)
        updated = self.repository.update_document_status(doc["id"], user_id, "completed")
        return updated or dict(doc, status="completed")

    async def process_document_upload_with_embeddings(
        self,
        user_id: str,
        filename: str,
        content: str,
        mime_type: str = "text/plain",
        page_count: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Full ingestion pipeline:
        1. Creates document record with status 'processing'.
        2. Chunks content.
        3. Computes dense embeddings with bounded batching.
        4. Idempotently persists chunks with vector embeddings.
        5. Updates status to 'completed'.
        On any failure during embedding/persistence, sets status to 'failed' and re-raises.
        """
        calc_page_count = page_count or max(1, len(content) // 1500)
        doc = self.repository.create_document(
            user_id=user_id,
            filename=filename,
            storage_path=f"uploads/{user_id}/{filename}",
            mime_type=mime_type,
            extracted_text=content,
            page_count=calc_page_count,
            status="processing",
        )

        try:
            chunks = self.chunker.chunk_text(content)
            if not chunks:
                updated = self.repository.update_document_status(doc["id"], user_id, "completed")
                return updated or dict(doc, status="completed")

            chunk_texts = [c.content for c in chunks]

            # Embed using configured provider and bounded batches
            embeddings = await self.orchestrator.provider.embed(chunk_texts, task_type="RETRIEVAL_DOCUMENT")

            if not embeddings or len(embeddings) != len(chunks):
                raise RuntimeError(
                    f"Embedding generation incomplete: expected {len(chunks)}, received {len(embeddings) if embeddings else 0}."
                )

            chunk_dicts = []
            for i, c in enumerate(chunks):
                emb = embeddings[i]
                if not emb or len(emb) != 384:
                    raise RuntimeError(f"Invalid embedding vector dimension for chunk {i}.")
                chunk_dicts.append({
                    "document_id": doc["id"],
                    "chunk_index": c.chunk_index,
                    "content": c.content,
                    "page_number": c.page_number,
                    "embedding": emb,
                })

            # Idempotently persist chunks with tenant scoping
            self.repository.save_chunks(doc["id"], chunk_dicts, user_id=user_id)

            # Mark completed only after indexing succeeds
            updated_doc = self.repository.update_document_status(
                document_id=doc["id"],
                user_id=user_id,
                status="completed",
            )
            return updated_doc or dict(doc, status="completed")

        except Exception as e:
            logger.error(f"Document embedding failed for '{filename}' ({doc['id']}): {e}")
            self.repository.update_document_status(
                document_id=doc["id"],
                user_id=user_id,
                status="failed",
                error_message=str(e),
            )
            raise

    async def retry_document_processing(
        self,
        user_id: str,
        document_id: str,
    ) -> Dict[str, Any]:
        """Retries indexing for a failed or interrupted document without creating duplicate chunks."""
        doc = self.repository.get_document(document_id, user_id)
        if not doc:
            raise DocumentNotFoundError(document_id)

        prior_status = doc.get("status", "processing")
        content = doc.get("extracted_text", "")
        if not content:
            raise RuntimeError(f"Document {document_id} has no extracted text to index.")

        self.repository.update_document_status(document_id, user_id, "processing")

        try:
            chunks = self.chunker.chunk_text(content)
            chunk_texts = [c.content for c in chunks]

            embeddings = await self.orchestrator.provider.embed(chunk_texts, task_type="RETRIEVAL_DOCUMENT")
            if not embeddings or len(embeddings) != len(chunks):
                raise RuntimeError("Retry embedding generation returned incomplete vectors.")

            chunk_dicts = [
                {
                    "document_id": doc["id"],
                    "chunk_index": c.chunk_index,
                    "content": c.content,
                    "page_number": c.page_number,
                    "embedding": embeddings[i],
                }
                for i, c in enumerate(chunks)
            ]

            # Idempotently overwrite chunks with tenant scoping (GAP-2)
            self.repository.save_chunks(doc["id"], chunk_dicts, user_id=user_id)

            updated = self.repository.update_document_status(document_id, user_id, "completed")
            return updated or dict(doc, status="completed")
        except Exception as e:
            if prior_status == "completed":
                # Preserve prior completed status so existing valid chunks and usability are not destroyed (GAP-3)
                logger.warning(
                    f"Retry failed for completed document {document_id}; preserving prior completed status: {e}"
                )
                self.repository.update_document_status(
                    document_id, user_id, "completed", error_message=f"Retry re-index failed: {e}"
                )
            else:
                self.repository.update_document_status(document_id, user_id, "failed", error_message=str(e))
            raise

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

        # 1. Query vector similarity search via pgvector
        query_embedding = None
        try:
            q_embeds = await self.orchestrator.provider.embed([question], task_type="RETRIEVAL_QUERY")
            if q_embeds and len(q_embeds) > 0:
                query_embedding = q_embeds[0]
        except Exception as e:
            logger.warning(f"Failed to generate query embedding: {e}")

        chunks = self.repository.search_chunks(
            document_id=document_id,
            user_id=user_id,
            query_embedding=query_embedding,
            limit=5,
        )
        if not chunks:
            chunks = self.repository.get_document_chunks(document_id, user_id)

        return await self.orchestrator.ask_document(
            document_id=document_id,
            question=question,
            chunks=chunks,
            target_language=language,
        )

    async def simplify_text(self, text: str, language: str = "en") -> str:
        return await self.orchestrator.simplify_text(text, target_language=language)
