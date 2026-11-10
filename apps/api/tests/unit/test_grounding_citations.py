import unittest
import uuid
from app.intelligence.verification.grounding import GroundingVerifier, EvidenceTier
from app.intelligence.orchestrator.orchestrator import AIOrchestrator
from app.intelligence.providers.mock_provider import MockAIProvider


class TestGroundingCitations(unittest.TestCase):
    """Exhaustive unit test suite for Citation Provenance, Verification, and Evidence Tiering."""

    def setUp(self):
        self.verifier = GroundingVerifier()
        self.doc_a_id = str(uuid.uuid4())
        self.doc_b_id = str(uuid.uuid4())

        self.chunk_a0 = {
            "document_id": self.doc_a_id,
            "chunk_index": 0,
            "page_number": 1,
            "content": "The National Disability Pension provides 3,000 INR monthly stipend to eligible citizens.",
        }
        self.chunk_a1 = {
            "document_id": self.doc_a_id,
            "chunk_index": 1,
            "page_number": 2,
            "content": "Applicants must submit proof of residence and a disability certificate with at least 40 percent disability.",
        }
        self.chunk_b0 = {
            "document_id": self.doc_b_id,
            "chunk_index": 0,
            "page_number": 1,
            "content": "The Student Education Grant covers tuition fees up to 50,000 INR per semester.",
        }

    def test_valid_citation_matching_doc_page_chunk(self):
        citations = [
            {
                "document_id": self.doc_a_id,
                "page_number": 1,
                "chunk_index": 0,
                "quoted_text": "3,000 INR monthly stipend",
            }
        ]
        verified = self.verifier.verify_citations(citations, [self.chunk_a0, self.chunk_a1], expected_document_id=self.doc_a_id)
        self.assertEqual(len(verified), 1)
        self.assertEqual(verified[0]["document_id"], self.doc_a_id)
        self.assertEqual(verified[0]["chunk_index"], 0)
        self.assertEqual(verified[0]["page_number"], 1)
        self.assertEqual(verified[0]["quoted_text"], "3,000 INR monthly stipend")

    def test_uuid_and_string_normalization(self):
        chunk_uuid = uuid.UUID(self.doc_a_id)
        chunk_with_uuid = dict(self.chunk_a0, document_id=chunk_uuid)
        citations = [
            {
                "document_id": self.doc_a_id.upper(),
                "page_number": 1,
                "chunk_index": 0,
                "quoted_text": "3,000 INR monthly stipend",
            }
        ]
        verified = self.verifier.verify_citations(citations, [chunk_with_uuid], expected_document_id=self.doc_a_id)
        self.assertEqual(len(verified), 1)
        self.assertEqual(verified[0]["chunk_index"], 0)

    def test_explicit_unknown_document_id_rejected(self):
        citations = [
            {
                "document_id": "unknown-nonexistent-doc-uuid",
                "page_number": 1,
                "chunk_index": 0,
                "quoted_text": "3,000 INR monthly stipend",
            }
        ]
        verified = self.verifier.verify_citations(citations, [self.chunk_a0], expected_document_id=self.doc_a_id)
        self.assertEqual(len(verified), 0)

    def test_ghost_document_id_in_multi_document_retrieval_rejected(self):
        """When expected_document_id is None, model citing non-existent doc must be strictly rejected."""
        available = [self.chunk_a0, self.chunk_b0]
        citations = [
            {
                "document_id": "doc-ghost-nonexistent",
                "page_number": 1,
                "chunk_index": 0,
                "quoted_text": "tuition fees up to 50,000 INR",
            }
        ]
        verified = self.verifier.verify_citations(citations, available, expected_document_id=None)
        self.assertEqual(len(verified), 0)

    def test_two_documents_with_identical_chunk_indices(self):
        """Chunks from doc A and doc B both have chunk_index 0; both must match accurately without collision."""
        available = [self.chunk_a0, self.chunk_b0]
        citations = [
            {
                "document_id": self.doc_a_id,
                "page_number": 1,
                "chunk_index": 0,
                "quoted_text": "3,000 INR monthly stipend",
            },
            {
                "document_id": self.doc_b_id,
                "page_number": 1,
                "chunk_index": 0,
                "quoted_text": "tuition fees up to 50,000 INR",
            },
        ]
        verified = self.verifier.verify_citations(citations, available, expected_document_id=None)
        self.assertEqual(len(verified), 2)
        by_doc = {c["document_id"]: c for c in verified}
        self.assertEqual(by_doc[self.doc_a_id]["quoted_text"], "3,000 INR monthly stipend")
        self.assertEqual(by_doc[self.doc_b_id]["quoted_text"], "tuition fees up to 50,000 INR")

    def test_missing_document_id_with_exactly_one_document_succeeds(self):
        citations = [
            {
                "document_id": "",
                "page_number": 1,
                "chunk_index": 0,
                "quoted_text": "3,000 INR monthly stipend",
            }
        ]
        verified = self.verifier.verify_citations(citations, [self.chunk_a0], expected_document_id=self.doc_a_id)
        self.assertEqual(len(verified), 1)
        self.assertEqual(verified[0]["document_id"], self.doc_a_id)

    def test_missing_document_id_with_multiple_documents_rejected(self):
        """When multiple documents are present, a citation lacking a document_id must be rejected as ambiguous."""
        available = [self.chunk_a0, self.chunk_b0]
        citations = [
            {
                "document_id": "",
                "page_number": 1,
                "chunk_index": 0,
                "quoted_text": "3,000 INR monthly stipend",
            }
        ]
        verified = self.verifier.verify_citations(citations, available, expected_document_id=None)
        self.assertEqual(len(verified), 0)

    def test_missing_document_id_with_ambiguous_chunk_indices_rejected(self):
        """When multiple documents share chunk_index 0, missing document_id must never guess which document."""
        available = [self.chunk_a0, self.chunk_b0]
        citations = [
            {
                "document_id": None,
                "page_number": 1,
                "chunk_index": 0,
                "quoted_text": "tuition fees up to 50,000 INR",
            }
        ]
        verified = self.verifier.verify_citations(citations, available, expected_document_id=None)
        self.assertEqual(len(verified), 0)

    def test_model_supplied_id_never_used_as_trusted_fallback(self):
        """Untrusted model document_id must never become canonical if chunk metadata lacks trusted ID."""
        chunk_untrusted = {
            "document_id": "",  # Missing trusted ID
            "chunk_index": 0,
            "page_number": 1,
            "content": "Valid text inside chunk without trusted document ID.",
        }
        citations = [
            {
                "document_id": "untrusted-model-injected-id",
                "page_number": 1,
                "chunk_index": 0,
                "quoted_text": "Valid text inside chunk",
            }
        ]
        verified = self.verifier.verify_citations(citations, [chunk_untrusted], expected_document_id=None)
        self.assertEqual(len(verified), 0)

    def test_incorrect_page_number_rejected(self):
        """Reported page mismatch must be rejected rather than silently corrected."""
        citations = [
            {
                "document_id": self.doc_a_id,
                "page_number": 5,  # Chunk is actually page 1
                "chunk_index": 0,
                "quoted_text": "3,000 INR monthly stipend",
            }
        ]
        verified = self.verifier.verify_citations(citations, [self.chunk_a0], expected_document_id=self.doc_a_id)
        self.assertEqual(len(verified), 0)

    def test_valid_page_number_accepted(self):
        citations = [
            {
                "document_id": self.doc_a_id,
                "page_number": 1,
                "chunk_index": 0,
                "quoted_text": "3,000 INR monthly stipend",
            }
        ]
        verified = self.verifier.verify_citations(citations, [self.chunk_a0], expected_document_id=self.doc_a_id)
        self.assertEqual(len(verified), 1)
        self.assertEqual(verified[0]["page_number"], 1)

    def test_invalid_chunk_index_rejected(self):
        citations = [
            {
                "document_id": self.doc_a_id,
                "page_number": 1,
                "chunk_index": 99,
                "quoted_text": "3,000 INR monthly stipend",
            }
        ]
        verified = self.verifier.verify_citations(citations, [self.chunk_a0], expected_document_id=self.doc_a_id)
        self.assertEqual(len(verified), 0)

    def test_quoted_text_present_in_retrieved_chunk(self):
        citations = [
            {
                "document_id": self.doc_a_id,
                "page_number": 2,
                "chunk_index": 1,
                "quoted_text": "at least 40 percent disability",
            }
        ]
        verified = self.verifier.verify_citations(citations, [self.chunk_a0, self.chunk_a1], expected_document_id=self.doc_a_id)
        self.assertEqual(len(verified), 1)
        self.assertEqual(verified[0]["quoted_text"], "at least 40 percent disability")

    def test_empty_and_whitespace_only_quotations_rejected(self):
        for empty_quote in ["", "   ", "\t\n  "]:
            citations = [
                {
                    "document_id": self.doc_a_id,
                    "page_number": 1,
                    "chunk_index": 0,
                    "quoted_text": empty_quote,
                }
            ]
            verified = self.verifier.verify_citations(citations, [self.chunk_a0], expected_document_id=self.doc_a_id)
            self.assertEqual(len(verified), 0)

    def test_very_short_quotations_rejected(self):
        """Quotes shorter than 3 characters (e.g. 'a', 'in') must be rejected as trivial."""
        for short_quote in ["a", "in", "to", "  a  "]:
            citations = [
                {
                    "document_id": self.doc_a_id,
                    "page_number": 1,
                    "chunk_index": 0,
                    "quoted_text": short_quote,
                }
            ]
            verified = self.verifier.verify_citations(citations, [self.chunk_a0], expected_document_id=self.doc_a_id)
            self.assertEqual(len(verified), 0)

    def test_valid_normalized_quotation_accepted(self):
        """Whitespace variations, newlines, and case differences must match robustly."""
        citations = [
            {
                "document_id": self.doc_a_id,
                "page_number": 1,
                "chunk_index": 0,
                "quoted_text": "3,000   INR\nMONTHLY   stipend",
            }
        ]
        verified = self.verifier.verify_citations(citations, [self.chunk_a0], expected_document_id=self.doc_a_id)
        self.assertEqual(len(verified), 1)

    def test_fabricated_quotation_rejected(self):
        citations = [
            {
                "document_id": self.doc_a_id,
                "page_number": 1,
                "chunk_index": 0,
                "quoted_text": "10,000 INR weekly allowance",
            }
        ]
        verified = self.verifier.verify_citations(citations, [self.chunk_a0], expected_document_id=self.doc_a_id)
        self.assertEqual(len(verified), 0)

    def test_cross_chunk_quotation_rejected(self):
        """Quotation bridging across chunk 0 and chunk 1 cannot be verified against either single chunk."""
        # Chunk 0 ends with 'citizens.', Chunk 1 begins with 'Applicants must'
        cross_quote = "eligible citizens. Applicants must submit"
        citations = [
            {
                "document_id": self.doc_a_id,
                "page_number": 1,
                "chunk_index": 0,
                "quoted_text": cross_quote,
            }
        ]
        verified = self.verifier.verify_citations(citations, [self.chunk_a0, self.chunk_a1], expected_document_id=self.doc_a_id)
        self.assertEqual(len(verified), 0)

    def test_duplicate_citations_deduplicated(self):
        citations = [
            {
                "document_id": self.doc_a_id,
                "page_number": 1,
                "chunk_index": 0,
                "quoted_text": "3,000 INR monthly stipend",
            },
            {
                "document_id": self.doc_a_id,
                "page_number": 1,
                "chunk_index": 0,
                "quoted_text": "3,000 INR monthly stipend",
            },
        ]
        verified = self.verifier.verify_citations(citations, [self.chunk_a0], expected_document_id=self.doc_a_id)
        self.assertEqual(len(verified), 1)

    def test_malformed_citation_structure_handled_safely(self):
        citations = [
            "not a dict",
            None,
            {"missing_chunk": 0},
            {"chunk_index": "not_an_int", "quoted_text": "some text"},
        ]
        verified = self.verifier.verify_citations(citations, [self.chunk_a0], expected_document_id=self.doc_a_id)
        self.assertEqual(len(verified), 0)

    def test_answer_with_no_citations(self):
        verified = self.verifier.verify_citations([], [self.chunk_a0], expected_document_id=self.doc_a_id)
        self.assertEqual(len(verified), 0)
        tier = self.verifier.classify_evidence_tier("The stipend is 3,000 INR.", verified)
        self.assertEqual(tier, EvidenceTier.TIER_3_SYNTHETIC)

    def test_valid_citations_from_multiple_retrieved_documents_accepted(self):
        available = [self.chunk_a0, self.chunk_b0]
        citations = [
            {
                "document_id": self.doc_a_id,
                "page_number": 1,
                "chunk_index": 0,
                "quoted_text": "3,000 INR monthly stipend",
            },
            {
                "document_id": self.doc_b_id,
                "page_number": 1,
                "chunk_index": 0,
                "quoted_text": "tuition fees up to 50,000 INR",
            },
        ]
        verified = self.verifier.verify_citations(citations, available)
        self.assertEqual(len(verified), 2)
        doc_ids = {c["document_id"] for c in verified}
        self.assertIn(self.doc_a_id, doc_ids)
        self.assertIn(self.doc_b_id, doc_ids)

    def test_cross_document_citation_attempts_rejected(self):
        available = [self.chunk_a0, self.chunk_b0]
        citations = [
            {
                "document_id": self.doc_a_id,
                "page_number": 1,
                "chunk_index": 0,
                "quoted_text": "tuition fees up to 50,000 INR",
            }
        ]
        verified = self.verifier.verify_citations(citations, available, expected_document_id=self.doc_a_id)
        self.assertEqual(len(verified), 0)

    def test_evidence_tier_behavior_with_valid_and_invalid_citations(self):
        valid_citations = [{"document_id": self.doc_a_id, "chunk_index": 0, "page_number": 1, "quoted_text": "proof"}]

        # 1. Information unavailable
        tier = self.verifier.classify_evidence_tier("Information unavailable in the provided document.", valid_citations)
        self.assertEqual(tier, EvidenceTier.TIER_4_UNAVAILABLE)

        # 2. Empty answer
        tier = self.verifier.classify_evidence_tier("", valid_citations)
        self.assertEqual(tier, EvidenceTier.TIER_4_UNAVAILABLE)

        # 3. Verified official
        tier = self.verifier.classify_evidence_tier("Official benefit", valid_citations, is_official_source=True)
        self.assertEqual(tier, EvidenceTier.TIER_1_OFFICIAL)

        # 4. Document grounded
        tier = self.verifier.classify_evidence_tier("Valid benefit", valid_citations, is_official_source=False)
        self.assertEqual(tier, EvidenceTier.TIER_2_DOCUMENT)

        # 5. Synthetic explanation (when citations are empty)
        tier = self.verifier.classify_evidence_tier("Uncited explanation", [], is_official_source=False)
        self.assertEqual(tier, EvidenceTier.TIER_3_SYNTHETIC)


class TestOrchestratorContextProvenance(unittest.IsolatedAsyncioTestCase):
    """Verifies that AIOrchestrator formats context blocks with [Doc <id>, Page <p>, Chunk <c>]."""

    async def test_context_header_contains_provenance_identifiers(self):
        mock_provider = MockAIProvider()
        orchestrator = AIOrchestrator(mock_provider)

        test_doc_id = "test-doc-provenance-uuid"
        chunks = [
            {
                "document_id": test_doc_id,
                "chunk_index": 0,
                "page_number": 1,
                "content": "The final submission deadline is 31st December 2026.",
            }
        ]

        res = await orchestrator.ask_document(
            document_id=test_doc_id,
            question="What is the deadline?",
            chunks=chunks,
            target_language="en",
        )

        self.assertIn("answer", res)
        self.assertIn("citations", res)
        self.assertEqual(len(res["citations"]), 1)
        self.assertEqual(res["citations"][0]["document_id"], test_doc_id)
        self.assertEqual(res["citations"][0]["chunk_index"], 0)
        self.assertEqual(res["evidence_tier"], EvidenceTier.TIER_2_DOCUMENT.value)


if __name__ == "__main__":
    unittest.main()
