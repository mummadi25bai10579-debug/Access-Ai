import unittest
from unittest.mock import AsyncMock, MagicMock, patch
import math
from app.intelligence.providers.gemini_provider import GeminiProvider
from app.intelligence.providers.mock_provider import MockAIProvider
from app.intelligence.providers.provider_factory import get_ai_provider
from app.config import settings


class TestGeminiProvider(unittest.IsolatedAsyncioTestCase):
    """Unit tests for the GeminiProvider and factory integration."""

    def setUp(self):
        self.api_key = "test-secret-gemini-key-98765"
        self.provider = GeminiProvider(
            api_key=self.api_key,
            model="gemini-3.8-flash",
            embedding_model="gemini-embedding-001",
            embedding_dimension=384,
            timeout=10.0,
        )

    def test_initialization_success(self):
        self.assertEqual(self.provider.api_key, self.api_key)
        self.assertEqual(self.provider.model, "gemini-3.8-flash")
        self.assertEqual(self.provider.embedding_model, "gemini-embedding-001")
        self.assertEqual(self.provider.embedding_dimension, 384)
        self.assertEqual(self.provider.timeout, 10.0)
        self.assertIsNotNone(self.provider.client)

    def test_missing_api_key_raises_value_error(self):
        with self.assertRaises(ValueError):
            GeminiProvider(api_key="")
        with self.assertRaises(ValueError):
            GeminiProvider(api_key="   ")
        with self.assertRaises(ValueError):
            GeminiProvider(api_key=None)  # type: ignore

    def test_custom_model_selection(self):
        p = GeminiProvider(api_key=self.api_key, model="custom-gemini-model")
        self.assertEqual(p.model, "custom-gemini-model")

    async def test_generate_plain_text_success(self):
        mock_response = MagicMock()
        mock_response.text = "This is a clean plain-text response from Gemini."

        with patch.object(
            self.provider.client.aio.models,
            "generate_content",
            new_callable=AsyncMock,
            return_value=mock_response,
        ) as mock_gen:
            res = await self.provider.generate("Explain algorithms", temperature=0.5)

            self.assertEqual(res, "This is a clean plain-text response from Gemini.")
            mock_gen.assert_awaited_once()
            call_kwargs = mock_gen.call_args.kwargs
            self.assertEqual(call_kwargs["model"], "gemini-3.8-flash")
            self.assertEqual(call_kwargs["contents"], "Explain algorithms")
            self.assertEqual(call_kwargs["config"].temperature, 0.5)

    async def test_generate_system_prompt_handling(self):
        mock_response = MagicMock()
        mock_response.text = "Tutor response"

        with patch.object(
            self.provider.client.aio.models,
            "generate_content",
            new_callable=AsyncMock,
            return_value=mock_response,
        ) as mock_gen:
            await self.provider.generate(
                prompt="Help with math",
                system_prompt="You are an expert tutor",
                temperature=0.3,
            )
            mock_gen.assert_awaited_once()
            config = mock_gen.call_args.kwargs["config"]
            self.assertEqual(config.system_instruction, "You are an expert tutor")
            self.assertEqual(config.temperature, 0.3)

    async def test_generate_empty_prompt_raises_value_error(self):
        with self.assertRaises(ValueError):
            await self.provider.generate("")

    async def test_generate_empty_api_response_raises_runtime_error(self):
        mock_response = MagicMock()
        mock_response.text = ""

        with patch.object(
            self.provider.client.aio.models,
            "generate_content",
            new_callable=AsyncMock,
            return_value=mock_response,
        ):
            with self.assertRaises(RuntimeError):
                await self.provider.generate("Test prompt")

    async def test_generate_api_error_redacts_api_key(self):
        error_with_key = f"API error 403: Forbidden with key {self.api_key} on endpoint"

        with patch.object(
            self.provider.client.aio.models,
            "generate_content",
            new_callable=AsyncMock,
            side_effect=Exception(error_with_key),
        ):
            with self.assertRaises(RuntimeError) as ctx:
                await self.provider.generate("Test prompt")

            err_msg = str(ctx.exception)
            self.assertNotIn(self.api_key, err_msg)
            self.assertIn("[REDACTED_API_KEY]", err_msg)

    async def test_generate_structured_json_success(self):
        mock_response = MagicMock()
        mock_response.text = '{"answer": "Verified eligibility", "confidence": "high"}'

        schema = {
            "type": "object",
            "properties": {
                "answer": {"type": "string"},
                "confidence": {"type": "string"},
            },
            "required": ["answer", "confidence"],
        }

        with patch.object(
            self.provider.client.aio.models,
            "generate_content",
            new_callable=AsyncMock,
            return_value=mock_response,
        ) as mock_gen:
            data = await self.provider.generate_structured(
                prompt="Evaluate scheme",
                schema=schema,
                system_prompt="Return strict JSON",
            )
            self.assertEqual(data["answer"], "Verified eligibility")
            self.assertEqual(data["confidence"], "high")

            config = mock_gen.call_args.kwargs["config"]
            self.assertEqual(config.response_mime_type, "application/json")
            self.assertEqual(config.response_schema, schema)
            self.assertEqual(config.system_instruction, "Return strict JSON")

    async def test_generate_structured_markdown_fence_cleaning(self):
        mock_response = MagicMock()
        mock_response.text = '```json\n{"result": "success", "count": 10}\n```'

        with patch.object(
            self.provider.client.aio.models,
            "generate_content",
            new_callable=AsyncMock,
            return_value=mock_response,
        ):
            data = await self.provider.generate_structured(
                prompt="Count items",
                schema={"type": "object"},
            )
            self.assertEqual(data["result"], "success")
            self.assertEqual(data["count"], 10)

    async def test_generate_structured_missing_required_field_raises_error(self):
        mock_response = MagicMock()
        mock_response.text = '{"other_key": "val"}'

        schema = {
            "type": "object",
            "properties": {"required_key": {"type": "string"}},
            "required": ["required_key"],
        }

        with patch.object(
            self.provider.client.aio.models,
            "generate_content",
            new_callable=AsyncMock,
            return_value=mock_response,
        ):
            with self.assertRaises(RuntimeError):
                await self.provider.generate_structured(
                    prompt="Test schema",
                    schema=schema,
                )

    async def test_generate_structured_malformed_json_raises_value_error(self):
        mock_response = MagicMock()
        mock_response.text = 'Not a JSON document { broken'

        with patch.object(
            self.provider.client.aio.models,
            "generate_content",
            new_callable=AsyncMock,
            return_value=mock_response,
        ):
            with self.assertRaises(ValueError) as ctx:
                await self.provider.generate_structured(
                    prompt="Test schema",
                    schema={"type": "object"},
                )
            self.assertIn("Malformed JSON", str(ctx.exception))

    async def test_embed_success_and_l2_normalization(self):
        # 384 non-normalized values
        raw_vector = [2.0] * 384
        mock_emb = MagicMock()
        mock_emb.values = raw_vector

        mock_response = MagicMock()
        mock_response.embeddings = [mock_emb]

        with patch.object(
            self.provider.client.aio.models,
            "embed_content",
            new_callable=AsyncMock,
            return_value=mock_response,
        ) as mock_embed:
            vectors = await self.provider.embed(["Sample document chunk"], task_type="RETRIEVAL_DOCUMENT")

            self.assertEqual(len(vectors), 1)
            vec = vectors[0]
            self.assertEqual(len(vec), 384)

            # Check L2 unit normalization: sum(x^2) == 1.0
            norm_squared = sum(x * x for x in vec)
            self.assertTrue(math.isclose(norm_squared, 1.0, rel_tol=1e-5))

            config = mock_embed.call_args.kwargs["config"]
            self.assertEqual(config.task_type, "RETRIEVAL_DOCUMENT")
            self.assertEqual(config.output_dimensionality, 384)

    async def test_embed_empty_texts_returns_empty_list(self):
        vectors = await self.provider.embed([])
        self.assertEqual(vectors, [])

    async def test_embed_query_task_type(self):
        raw_vector = [1.0] * 384
        mock_emb = MagicMock()
        mock_emb.values = raw_vector
        mock_response = MagicMock()
        mock_response.embeddings = [mock_emb]

        with patch.object(
            self.provider.client.aio.models,
            "embed_content",
            new_callable=AsyncMock,
            return_value=mock_response,
        ) as mock_embed:
            await self.provider.embed(["Search query text"], task_type="RETRIEVAL_QUERY")
            config = mock_embed.call_args.kwargs["config"]
            self.assertEqual(config.task_type, "RETRIEVAL_QUERY")
            self.assertEqual(config.output_dimensionality, 384)

    async def test_embed_dimension_mismatch_raises_error(self):
        # 768 dimensions instead of 384
        wrong_dim_vector = [1.0] * 768
        mock_emb = MagicMock()
        mock_emb.values = wrong_dim_vector
        mock_response = MagicMock()
        mock_response.embeddings = [mock_emb]

        with patch.object(
            self.provider.client.aio.models,
            "embed_content",
            new_callable=AsyncMock,
            return_value=mock_response,
        ):
            with self.assertRaises(RuntimeError) as ctx:
                await self.provider.embed(["Test text"])
            self.assertIn("Vector dimension mismatch", str(ctx.exception))

    async def test_embed_nan_or_inf_raises_error(self):
        nan_vector = [1.0] * 383 + [float("nan")]
        mock_emb = MagicMock()
        mock_emb.values = nan_vector
        mock_response = MagicMock()
        mock_response.embeddings = [mock_emb]

        with patch.object(
            self.provider.client.aio.models,
            "embed_content",
            new_callable=AsyncMock,
            return_value=mock_response,
        ):
            with self.assertRaises(RuntimeError) as ctx:
                await self.provider.embed(["Test text"])
            self.assertIn("NaN or infinite", str(ctx.exception))

    async def test_embed_zero_norm_raises_error(self):
        zero_vector = [0.0] * 384
        mock_emb = MagicMock()
        mock_emb.values = zero_vector
        mock_response = MagicMock()
        mock_response.embeddings = [mock_emb]

        with patch.object(
            self.provider.client.aio.models,
            "embed_content",
            new_callable=AsyncMock,
            return_value=mock_response,
        ):
            with self.assertRaises(RuntimeError) as ctx:
                await self.provider.embed(["Test text"])
            self.assertIn("Zero-norm vector", str(ctx.exception))


class TestProviderFactory(unittest.TestCase):
    """Unit tests for get_ai_provider factory routing and fallback prevention."""

    def test_factory_returns_mock_when_explicitly_configured(self):
        with patch.object(settings, "LLM_PROVIDER", "mock"):
            provider = get_ai_provider()
            self.assertIsInstance(provider, MockAIProvider)

    def test_factory_selects_gemini_when_configured(self):
        with patch.object(settings, "LLM_PROVIDER", "gemini"), \
             patch.object(settings, "LLM_MODEL", "gemini-3.8-flash"), \
             patch.object(settings, "LLM_API_KEY", "valid-gemini-key"):
            provider = get_ai_provider()
            self.assertIsInstance(provider, GeminiProvider)
            self.assertEqual(provider.model, "gemini-3.8-flash")
            self.assertEqual(provider.embedding_dimension, 384)

    def test_factory_selects_google_alias_when_configured(self):
        with patch.object(settings, "LLM_PROVIDER", "google"), \
             patch.object(settings, "LLM_API_KEY", "valid-google-key"):
            provider = get_ai_provider()
            self.assertIsInstance(provider, GeminiProvider)

    def test_factory_gemini_missing_api_key_raises_error_no_silent_fallback(self):
        """CRITICAL: Must never silently return MockAIProvider when Gemini is requested without a key."""
        with patch.object(settings, "LLM_PROVIDER", "gemini"), \
             patch.object(settings, "LLM_API_KEY", ""):
            with self.assertRaises(ValueError) as ctx:
                get_ai_provider()
            self.assertIn("LLM_API_KEY is required", str(ctx.exception))

    def test_factory_unsupported_provider_raises_value_error(self):
        with patch.object(settings, "LLM_PROVIDER", "anthropic_claude"), \
             patch.object(settings, "LLM_API_KEY", "some-key"):
            with self.assertRaises(ValueError) as ctx:
                get_ai_provider()
            self.assertIn("Unsupported LLM_PROVIDER", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()

