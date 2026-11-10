from typing import Dict, Any, List, Optional
from app.intelligence.providers.base import AIProvider
from app.intelligence.prompts.templates import (
    GROUNDED_QA_SYSTEM_PROMPT,
    SIMPLIFICATION_SYSTEM_PROMPT,
    TUTOR_SYSTEM_PROMPT,
)
from app.intelligence.verification.grounding import GroundingVerifier, EvidenceTier
from app.intelligence.multilingual.languages import get_language_meta

class AIOrchestrator:
    """
    Central AI Orchestrator routing requests through verified pipelines.
    """

    def __init__(self, provider: AIProvider):
        self.provider = provider
        self.verifier = GroundingVerifier()

    async def ask_document(
        self,
        document_id: str,
        question: str,
        chunks: List[Dict[str, Any]],
        target_language: str = "en",
    ) -> Dict[str, Any]:
        """
        Executes grounded document Q&A with untrusted delimiter isolation.
        """
        lang_meta = get_language_meta(target_language)
        sys_prompt = GROUNDED_QA_SYSTEM_PROMPT.format(target_language=lang_meta["name"])

        # Format context excerpts with unambiguous provenance headers
        context_blocks = []
        for c in chunks:
            doc_id_val = str(c.get("document_id") or document_id).strip()
            page_val = int(c.get("page_number", 1))
            chunk_idx_val = int(c.get("chunk_index", 0))
            context_blocks.append(
                f"[Doc {doc_id_val}, Page {page_val}, Chunk {chunk_idx_val}]:\n{c.get('content', '')}"
            )
        context_str = "\n\n".join(context_blocks)

        user_prompt = f"""<untrusted_document_context>
{context_str}
</untrusted_document_context>

User Question: {question}
Answer in {lang_meta['name']}:
Provide your answer strictly based on the excerpts above. For each factual claim in your answer, you MUST provide a citation referencing the exact document_id, page_number, chunk_index, and quoted_text from the excerpt headers above."""

        schema = {
            "type": "object",
            "properties": {
                "answer": {"type": "string"},
                "confidence": {"type": "string", "enum": ["high", "medium", "low", "none"]},
                "citations": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "document_id": {"type": "string"},
                            "page_number": {"type": "integer"},
                            "chunk_index": {"type": "integer"},
                            "quoted_text": {"type": "string"},
                        },
                        "required": ["document_id", "page_number", "chunk_index", "quoted_text"],
                    },
                },
            },
            "required": ["answer", "confidence", "citations"],
        }

        raw_result = await self.provider.generate_structured(user_prompt, schema, system_prompt=sys_prompt)
        answer = raw_result.get("answer", "")
        citations = raw_result.get("citations", [])
        verified_citations = self.verifier.verify_citations(
            citations,
            chunks,
            expected_document_id=document_id,
        )
        tier = self.verifier.classify_evidence_tier(answer, verified_citations)

        return {
            "answer": answer,
            "language": target_language,
            "confidence": raw_result.get("confidence", "medium"),
            "citations": verified_citations,
            "evidence_tier": tier.value,
        }

    async def simplify_text(self, text: str, target_language: str = "en") -> str:
        prompt = f"Please simplify this text to a 6th-grade reading level:\n\n{text}"
        return await self.provider.generate(prompt, system_prompt=SIMPLIFICATION_SYSTEM_PROMPT)

    async def tutor_dialogue(
        self,
        message: str,
        context_materials: Optional[str] = None,
        target_language: str = "en",
        difficulty_level: str = "beginner",
    ) -> Dict[str, Any]:
        lang_meta = get_language_meta(target_language)
        prompt = f"""Student Query: {message}
Difficulty Target: {difficulty_level}
Response Language: {lang_meta['name']}
Contextual Study Notes: {context_materials or 'General curriculum'}"""
        reply = await self.provider.generate(prompt, system_prompt=TUTOR_SYSTEM_PROMPT)
        return {
            "reply": reply,
            "concept_tags": ["Study Skills", "Foundations"],
            "recommended_review_topics": ["Review core definitions"],
        }
