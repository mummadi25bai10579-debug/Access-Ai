import hashlib
from typing import List, Dict, Any, Optional
from app.intelligence.providers.base import AIProvider

class MockAIProvider(AIProvider):
    """
    Deterministic Mock AI Provider for testing, CI, and local sandboxed runs.
    """

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
    ) -> str:
        if "translate" in prompt.lower() or "telugu" in prompt.lower():
            return "ఈ పత్రం ప్రకారం మీరు దరఖాస్తు చేసుకోవడానికి అర్హులు. (Mock Telugu Response)"
        if "simplify" in prompt.lower():
            return "This document explains how students can get financial support for college tuition fees in simple steps."
        return f"Mock response generated for prompt: {prompt[:80]}..."

    async def generate_structured(
        self,
        prompt: str,
        schema: Dict[str, Any],
        system_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        # Check quiz first
        if "quiz" in prompt.lower():
            return {
                "topic": "Python Fundamentals",
                "questions": [
                    {
                        "question_id": "q1",
                        "question_text": "Which data type is used for key-value pairs in Python?",
                        "options": ["List", "Dictionary", "Tuple", "Set"],
                        "correct_option_index": 1,
                        "explanation": "Dictionaries in Python store data as key-value pairs.",
                    }
                ],
            }
        if "question" in prompt.lower() or "citations" in str(schema).lower():
            return {
                "answer": "The application deadline is December 31st, 2026, as specified in the official circular.",
                "confidence": "high",
                "citations": [
                    {
                        "document_id": "mock-doc-uuid",
                        "page_number": 1,
                        "chunk_index": 0,
                        "quoted_text": "The final submission deadline is 31st December 2026.",
                    }
                ],
            }
        return {"result": "success", "summary": "Sample mock structured extraction"}

    async def embed(
        self,
        texts: List[str],
    ) -> List[List[float]]:
        """
        Generates pseudo-random 384-dimensional unit vectors derived from text hash.
        Guarantees deterministic vector math during tests.
        """
        dimension = 384
        embeddings = []
        for text in texts:
            seed = int(hashlib.sha256(text.encode("utf-8")).hexdigest(), 16)
            vector = []
            for i in range(dimension):
                val = ((seed + i * 31) % 1000) / 1000.0 - 0.5
                vector.append(val)
            norm = sum(x * x for x in vector) ** 0.5 or 1.0
            vector = [x / norm for x in vector]
            embeddings.append(vector)
        return embeddings
