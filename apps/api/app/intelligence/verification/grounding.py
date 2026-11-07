from typing import List, Dict, Any
from enum import Enum

class EvidenceTier(str, Enum):
    TIER_1_OFFICIAL = "verified_official"
    TIER_2_DOCUMENT = "document_grounded"
    TIER_3_SYNTHETIC = "ai_generated_explanation"
    TIER_4_UNAVAILABLE = "information_unavailable"

class GroundingVerifier:
    """
    Validates factual citations against retrieved chunks and categorizes evidence tier.
    """

    def verify_citations(
        self,
        citations: List[Dict[str, Any]],
        available_chunks: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        valid_citations = []
        chunk_map = {
            (c.get("document_id"), c.get("chunk_index")): c
            for c in available_chunks
        }

        for cit in citations:
            key = (cit.get("document_id"), cit.get("chunk_index"))
            if key in chunk_map or not available_chunks:
                valid_citations.append(cit)

        return valid_citations

    def classify_evidence_tier(
        self,
        answer: str,
        citations: List[Dict[str, Any]],
        is_official_source: bool = False,
    ) -> EvidenceTier:
        if not answer or "information unavailable" in answer.lower():
            return EvidenceTier.TIER_4_UNAVAILABLE
        if is_official_source:
            return EvidenceTier.TIER_1_OFFICIAL
        if citations and len(citations) > 0:
            return EvidenceTier.TIER_2_DOCUMENT
        return EvidenceTier.TIER_3_SYNTHETIC
