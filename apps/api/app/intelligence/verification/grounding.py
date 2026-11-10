import logging
from typing import List, Dict, Any, Optional
from enum import Enum

logger = logging.getLogger(__name__)


class EvidenceTier(str, Enum):
    TIER_1_OFFICIAL = "verified_official"
    TIER_2_DOCUMENT = "document_grounded"
    TIER_3_SYNTHETIC = "ai_generated_explanation"
    TIER_4_UNAVAILABLE = "information_unavailable"


def _normalize_for_search(text: str) -> str:
    """Normalizes whitespace and strips enclosing quote marks for robust substring containment."""
    if not text:
        return ""
    cleaned = text.strip().strip("'\"“”‘’`")
    return " ".join(cleaned.lower().split())


class GroundingVerifier:
    """
    Validates factual citations against retrieved chunks and categorizes evidence tier.
    """

    # Minimum quote length in non-whitespace characters to prevent trivial matches
    MIN_QUOTE_LENGTH = 3

    def verify_citations(
        self,
        citations: List[Dict[str, Any]],
        available_chunks: List[Dict[str, Any]],
        expected_document_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Validates citations against available chunks.
        Requires:
        1. Valid chunk matching (document_id, chunk_index).
        2. Non-empty quoted_text meeting minimum length requirement.
        3. quoted_text must actually be present in the chunk's content.
        4. Matching page_number when provided by citation.
        5. Rejects duplicates, cross-document mismatches, and malformed entries.
        """
        if not citations or not available_chunks:
            return []

        # Build normalized chunk maps
        # Primary lookup: (normalized_doc_id, chunk_index) -> chunk
        chunk_map: Dict[tuple, Dict[str, Any]] = {}
        distinct_doc_ids = set()

        for c in available_chunks:
            raw_doc_id = c.get("document_id") or expected_document_id or ""
            norm_doc_id = str(raw_doc_id).strip().lower()
            if norm_doc_id:
                distinct_doc_ids.add(norm_doc_id)
            try:
                chunk_idx = int(c.get("chunk_index", 0))
            except (ValueError, TypeError):
                chunk_idx = 0

            chunk_map[(norm_doc_id, chunk_idx)] = c

        # Only allow index-only fallback when exactly ONE trusted document is present
        is_single_doc_context = (len(distinct_doc_ids) == 1)
        chunk_by_idx: Dict[int, Dict[str, Any]] = {}
        if is_single_doc_context:
            for c in available_chunks:
                try:
                    c_idx = int(c.get("chunk_index", 0))
                    chunk_by_idx[c_idx] = c
                except (ValueError, TypeError):
                    pass

        valid_citations: List[Dict[str, Any]] = []
        seen_citations = set()

        for cit in citations:
            if not isinstance(cit, dict):
                logger.debug("Rejected citation: item is not a dictionary.")
                continue

            raw_cit_doc = cit.get("document_id")
            raw_chunk_idx = cit.get("chunk_index")
            quoted_text = str(cit.get("quoted_text") or "").strip()

            # 1. Quoted text must be non-empty and satisfy minimum meaningful length
            if not quoted_text:
                logger.debug("Rejected citation: empty or missing quoted_text.")
                continue

            norm_quote = _normalize_for_search(quoted_text)
            if len(norm_quote.strip()) < self.MIN_QUOTE_LENGTH:
                logger.debug(f"Rejected citation: quote '{quoted_text}' is too short (min {self.MIN_QUOTE_LENGTH} chars).")
                continue

            # 2. Chunk index must be a valid integer
            try:
                chunk_idx = int(raw_chunk_idx)
            except (ValueError, TypeError):
                logger.debug(f"Rejected citation: invalid chunk_index '{raw_chunk_idx}'.")
                continue

            # 3. Document ID normalization & resolution
            norm_cit_doc = str(raw_cit_doc).strip().lower() if raw_cit_doc else ""

            matched_chunk = None
            if norm_cit_doc:
                # Explicit model-supplied document ID MUST exist in retrieved chunks
                if (norm_cit_doc, chunk_idx) in chunk_map:
                    matched_chunk = chunk_map[(norm_cit_doc, chunk_idx)]
                else:
                    logger.debug(f"Rejected citation: explicit doc ID '{norm_cit_doc}' not found in retrieved chunks.")
                    continue
            else:
                # Document-ID-free citation: permitted ONLY in single-document context
                if is_single_doc_context and chunk_idx in chunk_by_idx:
                    matched_chunk = chunk_by_idx[chunk_idx]
                else:
                    logger.debug(f"Rejected citation: missing doc ID in multi-doc or ambiguous context.")
                    continue

            if not matched_chunk:
                logger.debug(f"Rejected citation: chunk ({norm_cit_doc}, {chunk_idx}) not found in retrieved chunks.")
                continue

            # 4. Verify reported page_number against the actual retrieved chunk
            chunk_page = matched_chunk.get("page_number", 1)
            raw_cit_page = cit.get("page_number")
            if raw_cit_page is not None:
                try:
                    cit_page = int(raw_cit_page)
                    if cit_page != int(chunk_page):
                        logger.debug(f"Rejected citation: page mismatch (cited {cit_page} != chunk {chunk_page}).")
                        continue
                except (ValueError, TypeError):
                    logger.debug(f"Rejected citation: invalid page_number '{raw_cit_page}'.")
                    continue

            # 5. Verify quoted text actually exists inside the chunk content
            chunk_content = str(matched_chunk.get("content", ""))
            norm_chunk = _normalize_for_search(chunk_content)

            if not norm_quote or norm_quote not in norm_chunk:
                logger.debug(f"Rejected citation: quoted text '{quoted_text[:40]}...' not found in chunk {chunk_idx}.")
                continue

            # 6. Extract canonical document ID from trusted chunk metadata ONLY
            canonical_doc_id = str(matched_chunk.get("document_id") or expected_document_id or "").strip()
            if not canonical_doc_id:
                logger.debug("Rejected citation: no trusted canonical document ID found.")
                continue

            # Deduplication
            dedup_key = (canonical_doc_id.lower(), chunk_idx, norm_quote)
            if dedup_key in seen_citations:
                continue
            seen_citations.add(dedup_key)

            valid_citations.append({
                "document_id": canonical_doc_id,
                "page_number": int(chunk_page),
                "chunk_index": chunk_idx,
                "quoted_text": quoted_text,
            })

        return valid_citations

    def classify_evidence_tier(
        self,
        answer: str,
        citations: List[Dict[str, Any]],
        is_official_source: bool = False,
    ) -> EvidenceTier:
        if not answer or "information unavailable" in answer.lower():
            return EvidenceTier.TIER_4_UNAVAILABLE
        if is_official_source and citations and len(citations) > 0:
            return EvidenceTier.TIER_1_OFFICIAL
        if citations and len(citations) > 0:
            return EvidenceTier.TIER_2_DOCUMENT
        return EvidenceTier.TIER_3_SYNTHETIC
