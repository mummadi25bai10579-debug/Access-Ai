import unittest
import json
from unittest.mock import AsyncMock, MagicMock, patch
from app.intelligence.providers.gemini_provider import GeminiProvider
from app.core.exceptions import AIResponseMalformedError


class TestRecursiveStructuredValidation(unittest.IsolatedAsyncioTestCase):
    """Exhaustive tests for recursive JSON schema validation against LLM outputs."""

    def setUp(self):
        self.provider = GeminiProvider(
            api_key="test-gemini-key-for-validation-unit-tests",
            model="gemini-3.8-flash",
        )

        self.nested_schema = {
            "type": "object",
            "properties": {
                "answer": {"type": "string"},
                "confidence": {"type": "string", "enum": ["high", "medium", "low", "none"]},
                "score": {"type": "number"},
                "rank": {"type": "integer"},
                "is_verified": {"type": "boolean"},
                "metadata": {
                    "type": "object",
                    "properties": {
                        "source": {"type": "string"},
                        "tag_count": {"type": "integer"},
                    },
                    "required": ["source"],
                },
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

    async def _mock_generation(self, raw_text: str):
        mock_resp = MagicMock()
        mock_resp.text = raw_text
        with patch.object(self.provider.client.aio.models, "generate_content", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = mock_resp
            return await self.provider.generate_structured("prompt", self.nested_schema)

    async def test_valid_nested_payload_passes(self):
        valid_payload = {
            "answer": "This is a valid answer.",
            "confidence": "high",
            "score": 98.5,
            "rank": 1,
            "is_verified": True,
            "metadata": {
                "source": "official_gazette",
                "tag_count": 3,
            },
            "citations": [
                {
                    "document_id": "doc-uuid-1",
                    "page_number": 1,
                    "chunk_index": 0,
                    "quoted_text": "Sample valid quote",
                }
            ],
        }
        res = await self._mock_generation(json.dumps(valid_payload))
        self.assertEqual(res["answer"], "This is a valid answer.")
        self.assertEqual(res["confidence"], "high")
        self.assertEqual(len(res["citations"]), 1)

    async def test_missing_top_level_required_field_rejected(self):
        payload = {
            "answer": "Answer without confidence or citations",
        }
        with self.assertRaises(AIResponseMalformedError) as ctx:
            await self._mock_generation(json.dumps(payload))
        self.assertIn("missing required field 'confidence'", str(ctx.exception))

    async def test_missing_nested_required_field_rejected(self):
        payload = {
            "answer": "Answer with metadata missing 'source'",
            "confidence": "medium",
            "metadata": {
                "tag_count": 2,  # Missing 'source'
            },
            "citations": [],
        }
        with self.assertRaises(AIResponseMalformedError) as ctx:
            await self._mock_generation(json.dumps(payload))
        self.assertIn("missing required field 'source'", str(ctx.exception))

    async def test_invalid_enum_value_rejected(self):
        payload = {
            "answer": "Valid answer",
            "confidence": "super_high",  # Not in ["high", "medium", "low", "none"]
            "citations": [],
        }
        with self.assertRaises(AIResponseMalformedError) as ctx:
            await self._mock_generation(json.dumps(payload))
        self.assertIn("not in allowed enum", str(ctx.exception))

    async def test_invalid_primitive_type_rejected(self):
        payload = {
            "answer": 12345,  # Expected string, got integer
            "confidence": "low",
            "citations": [],
        }
        with self.assertRaises(AIResponseMalformedError) as ctx:
            await self._mock_generation(json.dumps(payload))
        self.assertIn("expected string", str(ctx.exception))

    async def test_boolean_not_mistaken_for_integer(self):
        """Python's isinstance(True, int) is True, but schema validator must distinguish boolean from integer."""
        payload = {
            "answer": "Valid answer",
            "confidence": "low",
            "rank": True,  # Schema expects integer, not boolean
            "citations": [],
        }
        with self.assertRaises(AIResponseMalformedError) as ctx:
            await self._mock_generation(json.dumps(payload))
        self.assertIn("expected integer, got bool", str(ctx.exception))

    async def test_invalid_array_type_rejected(self):
        payload = {
            "answer": "Valid answer",
            "confidence": "low",
            "citations": "not an array",  # Expected array
        }
        with self.assertRaises(AIResponseMalformedError) as ctx:
            await self._mock_generation(json.dumps(payload))
        self.assertIn("expected array", str(ctx.exception))

    async def test_invalid_citation_item_missing_required_field(self):
        payload = {
            "answer": "Valid answer",
            "confidence": "low",
            "citations": [
                {
                    "document_id": "doc-uuid",
                    "page_number": 1,
                    # Missing chunk_index and quoted_text
                }
            ],
        }
        with self.assertRaises(AIResponseMalformedError) as ctx:
            await self._mock_generation(json.dumps(payload))
        self.assertIn("missing required field 'chunk_index'", str(ctx.exception))

    async def test_invalid_citation_item_wrong_type(self):
        payload = {
            "answer": "Valid answer",
            "confidence": "low",
            "citations": [
                {
                    "document_id": "doc-uuid",
                    "page_number": "one",  # String instead of integer
                    "chunk_index": 0,
                    "quoted_text": "Sample quote",
                }
            ],
        }
        with self.assertRaises(AIResponseMalformedError) as ctx:
            await self._mock_generation(json.dumps(payload))
        self.assertIn("expected integer, got str", str(ctx.exception))

    async def test_additional_properties_false_rejected(self):
        strict_schema = {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
            },
            "required": ["name"],
            "additionalProperties": False,
        }
        payload = {
            "name": "AccessAI",
            "hallucinated_extra_key": "unwanted value",
        }
        mock_resp = MagicMock()
        mock_resp.text = json.dumps(payload)
        with patch.object(self.provider.client.aio.models, "generate_content", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = mock_resp
            with self.assertRaises(AIResponseMalformedError) as ctx:
                await self.provider.generate_structured("prompt", strict_schema)
            self.assertIn("unexpected property 'hallucinated_extra_key'", str(ctx.exception))

    async def test_markdown_fence_cleaning_with_nested_json(self):
        payload = {
            "answer": "Markdown cleaned answer",
            "confidence": "high",
            "citations": [],
        }
        markdown_text = f"```json\n{json.dumps(payload)}\n```"
        res = await self._mock_generation(markdown_text)
        self.assertEqual(res["answer"], "Markdown cleaned answer")

    async def test_unparseable_malformed_json_rejected(self):
        with self.assertRaises(AIResponseMalformedError) as ctx:
            await self._mock_generation("{ broken json without closing brace")
        self.assertIn("Malformed JSON", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()

