import unittest
import asyncio
from app.modules.access.repository import DocumentRepository
from app.modules.access.service import AccessService
from app.intelligence.providers.mock_provider import MockAIProvider
from app.intelligence.orchestrator.orchestrator import AIOrchestrator

class TestRagPipeline(unittest.TestCase):
    def setUp(self):
        self.provider = MockAIProvider()
        self.orchestrator = AIOrchestrator(self.provider)
        self.repo = DocumentRepository(db=None)
        self.service = AccessService(self.orchestrator, self.repo)

    def test_full_rag_ingest_and_grounded_query(self):
        user_id = "user_rag_test_1"
        doc = asyncio.run(
            self.service.process_document_upload_with_embeddings(
                user_id=user_id,
                filename="scholarship_circular.txt",
                content="The final submission deadline for National Scholarship is 31st December 2026. Applicants must have 75% attendance.",
            )
        )
        self.assertIsNotNone(doc["id"])
        self.assertEqual(doc["status"], "completed")

        # Test grounded question
        res = asyncio.run(
            self.service.ask_document(
                user_id=user_id,
                document_id=doc["id"],
                question="What is the deadline for the scholarship?",
                language="en",
            )
        )
        self.assertIn("answer", res)
        self.assertIn("citations", res)
        self.assertIn(res["evidence_tier"], ["document_grounded", "ai_generated_explanation"])

    def test_cross_tenant_isolation_in_rag(self):
        user_a = "user_tenant_a"
        user_b = "user_tenant_b"

        doc_a = self.service.process_document_upload(
            user_id=user_a,
            filename="private_a.txt",
            content="Confidential financial report of user A: Income is 100,000.",
        )

        # User B should not be able to retrieve or query User A's document chunks
        from app.core.exceptions import DocumentNotFoundError
        with self.assertRaises(DocumentNotFoundError):
            asyncio.run(
                self.service.ask_document(
                    user_id=user_b,
                    document_id=doc_a["id"],
                    question="What is the income?",
                )
            )

if __name__ == "__main__":
    unittest.main()
