import asyncio
import unittest
from unittest.mock import AsyncMock, MagicMock, patch
from app.modules.access.repository import DocumentRepository
from app.modules.access.service import AccessService
from app.intelligence.providers.mock_provider import MockAIProvider
from app.intelligence.orchestrator.orchestrator import AIOrchestrator
from app.core.exceptions import (
    AIServiceUnavailableError,
    AIRateLimitExceededError,
    DocumentNotFoundError,
)


class TestDocumentLifecycleAndRetry(unittest.IsolatedAsyncioTestCase):
    """Exhaustive tests for document state machine, idempotent persistence, and failure recovery."""

    def setUp(self):
        self.provider = MockAIProvider()
        self.orchestrator = AIOrchestrator(self.provider)
        self.repository = DocumentRepository(db=None)
        self.service = AccessService(self.orchestrator, self.repository)
        self.test_user = "user_lifecycle_test_01"
        self.other_user = "user_lifecycle_test_02"

    async def test_successful_document_processing_lifecycle(self):
        """Document transitions from processing to completed upon successful chunking and embedding."""
        doc = await self.service.process_document_upload_with_embeddings(
            user_id=self.test_user,
            filename="circular_success.txt",
            content="Official circular text for successful lifecycle test.",
        )
        self.assertEqual(doc["status"], "completed")

        # Verify chunks saved
        chunks = self.repository.get_document_chunks(doc["id"], self.test_user)
        self.assertGreater(len(chunks), 0)
        for c in chunks:
            self.assertIn("embedding", c)
            self.assertEqual(len(c["embedding"]), 384)

    async def test_embedding_failure_transitions_to_failed_never_completed(self):
        """When embedding fails, document must be marked 'failed' and never 'completed'."""
        with patch.object(self.provider, "embed", new_callable=AsyncMock) as mock_embed:
            mock_embed.side_effect = AIServiceUnavailableError("Google AI service unavailable")

            with self.assertRaises(AIServiceUnavailableError):
                await self.service.process_document_upload_with_embeddings(
                    user_id=self.test_user,
                    filename="circular_fail.txt",
                    content="Official circular that will fail during embedding.",
                )

        # Retrieve document from repository and verify it was marked 'failed'
        docs = self.repository.list_user_documents(self.test_user)
        failed_doc = next((d for d in docs if d["filename"] == "circular_fail.txt"), None)
        self.assertIsNotNone(failed_doc)
        self.assertEqual(failed_doc["status"], "failed")
        self.assertIn("processing_error", failed_doc.get("metadata", {}))

    async def test_partial_batch_failure_marks_document_failed(self):
        """If embedding generation returns incomplete embeddings, document must be marked 'failed'."""
        with patch.object(self.provider, "embed", new_callable=AsyncMock) as mock_embed:
            # Return empty embeddings list
            mock_embed.return_value = []

            with self.assertRaises(RuntimeError) as ctx:
                await self.service.process_document_upload_with_embeddings(
                    user_id=self.test_user,
                    filename="circular_partial.txt",
                    content="Content requiring multiple chunks to embed.",
                )
            self.assertIn("incomplete", str(ctx.exception).lower())

        docs = self.repository.list_user_documents(self.test_user)
        doc = next(d for d in docs if d["filename"] == "circular_partial.txt")
        self.assertEqual(doc["status"], "failed")

    async def test_idempotent_chunk_persistence_prevents_duplicates(self):
        """Repeatedly calling save_chunks on the same document must not duplicate chunk records."""
        doc = self.repository.create_document(
            user_id=self.test_user,
            filename="idempotent_test.txt",
            storage_path="uploads/test/idempotent_test.txt",
            mime_type="text/plain",
        )
        sample_chunks = [
            {"chunk_index": 0, "content": "Chunk zero", "page_number": 1, "embedding": [0.1] * 384},
            {"chunk_index": 1, "content": "Chunk one", "page_number": 1, "embedding": [0.2] * 384},
        ]

        # Call save_chunks first time
        self.repository.save_chunks(doc["id"], sample_chunks)
        chunks_1 = self.repository.get_document_chunks(doc["id"], self.test_user)
        self.assertEqual(len(chunks_1), 2)

        # Call save_chunks second time with same or updated chunks
        self.repository.save_chunks(doc["id"], sample_chunks)
        chunks_2 = self.repository.get_document_chunks(doc["id"], self.test_user)
        self.assertEqual(len(chunks_2), 2)  # MUST NOT BE 4!

    async def test_retry_after_failure_recovers_to_completed(self):
        """A failed document can be successfully retried and transitioned to 'completed'."""
        # Step 1: Ingest document with failing embed
        with patch.object(self.provider, "embed", new_callable=AsyncMock) as mock_embed:
            mock_embed.side_effect = AIRateLimitExceededError("Rate limit exceeded")
            with self.assertRaises(AIRateLimitExceededError):
                await self.service.process_document_upload_with_embeddings(
                    user_id=self.test_user,
                    filename="retryable_doc.txt",
                    content="Text for document that will initially fail and then retry.",
                )

        docs = self.repository.list_user_documents(self.test_user)
        doc = next(d for d in docs if d["filename"] == "retryable_doc.txt")
        self.assertEqual(doc["status"], "failed")

        # Step 2: Retry with working provider
        recovered = await self.service.retry_document_processing(self.test_user, doc["id"])
        self.assertEqual(recovered["status"], "completed")

        # Verify chunks exist and are not duplicated
        chunks = self.repository.get_document_chunks(doc["id"], self.test_user)
        self.assertGreater(len(chunks), 0)

    async def test_tenant_isolation_on_retry(self):
        """User B cannot retry or access User A's document."""
        doc = await self.service.process_document_upload_with_embeddings(
            user_id=self.test_user,
            filename="private_doc_a.txt",
            content="Confidential document owned by user A.",
        )

        with self.assertRaises(DocumentNotFoundError):
            await self.service.retry_document_processing(self.other_user, doc["id"])

    async def test_retry_failure_on_completed_document_preserves_completed_status(self):
        """GAP-3: A retry failure on an already completed document must preserve 'completed' status and existing chunks."""
        doc = await self.service.process_document_upload_with_embeddings(
            user_id=self.test_user,
            filename="durable_doc.txt",
            content="Valid text that was successfully indexed.",
        )
        self.assertEqual(doc["status"], "completed")
        initial_chunks = self.repository.get_document_chunks(doc["id"], self.test_user)
        self.assertGreater(len(initial_chunks), 0)

        # Now simulate a retry where embedding upstream fails (e.g., 503)
        with patch.object(self.provider, "embed", new_callable=AsyncMock) as mock_embed:
            mock_embed.side_effect = AIServiceUnavailableError("Upstream spike")
            with self.assertRaises(AIServiceUnavailableError):
                await self.service.retry_document_processing(self.test_user, doc["id"])

        # Status must remain completed, not corrupted to 'failed'
        persisted_doc = self.repository.get_document(doc["id"], self.test_user)
        self.assertEqual(persisted_doc["status"], "completed")

        # Chunks must still exist and be intact
        surviving_chunks = self.repository.get_document_chunks(doc["id"], self.test_user)
        self.assertEqual(len(surviving_chunks), len(initial_chunks))

    def test_save_chunks_tenant_scoping_prevents_cross_tenant_injection(self):
        """GAP-2: save_chunks with user_id enforces tenant ownership."""
        doc = self.repository.create_document(
            user_id=self.test_user,
            filename="owner_doc.txt",
            storage_path="uploads/owner_doc.txt",
            mime_type="text/plain",
        )
        unauthorized_chunks = [
            {"chunk_index": 0, "content": "Injected malicious chunk", "page_number": 1, "embedding": [0.0] * 384}
        ]
        # Attempt to save chunks under wrong user
        self.repository.save_chunks(doc["id"], unauthorized_chunks, user_id=self.other_user)

        # Chunks for test_user should not have the unauthorized content
        chunks = self.repository.get_document_chunks(doc["id"], self.test_user)
        self.assertEqual(len(chunks), 0)


if __name__ == "__main__":
    unittest.main()

