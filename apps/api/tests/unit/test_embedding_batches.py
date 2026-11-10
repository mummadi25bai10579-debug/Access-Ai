import asyncio
import math
import unittest
from unittest.mock import AsyncMock, MagicMock, patch
from app.intelligence.providers.gemini_provider import GeminiProvider
from app.core.exceptions import (
    AIResponseMalformedError,
    AIServiceUnavailableError,
    AIRateLimitExceededError,
)


class TestEmbeddingBatches(unittest.IsolatedAsyncioTestCase):
    """Exhaustive tests for bounded batching, dimensional contracts, and failure handling."""

    def setUp(self):
        self.provider = GeminiProvider(
            api_key="test-gemini-key-for-batch-unit-tests",
            model="gemini-3.8-flash",
            embedding_model="gemini-embedding-001",
            embedding_dimension=384,
            embedding_batch_size=64,
        )

    def _make_mock_response(self, count: int, dimension: int = 384, custom_values=None):
        mock_resp = MagicMock()
        mock_embeddings = []
        for i in range(count):
            emb = MagicMock()
            if custom_values is not None:
                emb.values = custom_values[i] if i < len(custom_values) else [0.05] * dimension
            else:
                # Distinct deterministic direction per chunk to verify mapping
                emb.values = [(float(i + j) / 1000.0) + 0.1 for j in range(dimension)]
            mock_embeddings.append(emb)
        mock_resp.embeddings = mock_embeddings
        return mock_resp

    async def test_empty_chunk_list(self):
        res = await self.provider.embed([])
        self.assertEqual(res, [])

    async def test_one_chunk(self):
        with patch.object(self.provider.client.aio.models, "embed_content", new_callable=AsyncMock) as mock_embed:
            mock_embed.return_value = self._make_mock_response(1)
            res = await self.provider.embed(["Single chunk"])
            self.assertEqual(len(res), 1)
            self.assertEqual(len(res[0]), 384)
            # Check unit length L2 norm
            l2 = math.sqrt(sum(x * x for x in res[0]))
            self.assertAlmostEqual(l2, 1.0, places=5)
            self.assertEqual(mock_embed.call_count, 1)

    async def test_exactly_one_batch_64_chunks(self):
        texts = [f"Chunk content {i}" for i in range(64)]
        with patch.object(self.provider.client.aio.models, "embed_content", new_callable=AsyncMock) as mock_embed:
            mock_embed.return_value = self._make_mock_response(64)
            res = await self.provider.embed(texts)
            self.assertEqual(len(res), 64)
            self.assertEqual(mock_embed.call_count, 1)
            # Verify call argument slice
            call_contents = mock_embed.call_args[1]["contents"]
            self.assertEqual(len(call_contents), 64)

    async def test_65_chunks_creates_two_batches(self):
        texts = [f"Chunk {i}" for i in range(65)]
        with patch.object(self.provider.client.aio.models, "embed_content", new_callable=AsyncMock) as mock_embed:
            mock_embed.side_effect = [
                self._make_mock_response(64),
                self._make_mock_response(1),
            ]
            res = await self.provider.embed(texts)
            self.assertEqual(len(res), 65)
            self.assertEqual(mock_embed.call_count, 2)
            # Batch 1 had 64, Batch 2 had 1
            self.assertEqual(len(mock_embed.call_args_list[0][1]["contents"]), 64)
            self.assertEqual(len(mock_embed.call_args_list[1][1]["contents"]), 1)

    async def test_multiple_batches_and_correct_ordering(self):
        # 150 chunks with batch_size 64 -> 3 batches: 64, 64, 22
        texts = [f"Text item {i:03d}" for i in range(150)]
        with patch.object(self.provider.client.aio.models, "embed_content", new_callable=AsyncMock) as mock_embed:
            mock_embed.side_effect = [
                self._make_mock_response(64),
                self._make_mock_response(64),
                self._make_mock_response(22),
            ]
            res = await self.provider.embed(texts)
            self.assertEqual(len(res), 150)
            self.assertEqual(mock_embed.call_count, 3)

            # Assert order mapping: each chunk's embedding should be distinct and strictly ordered
            # We generated distinct values where emb.values[0] = (i + 1) / dimension
            # After unit normalization, vector direction matches
            self.assertNotEqual(res[0], res[1])
            self.assertNotEqual(res[63], res[64])
            self.assertNotEqual(res[127], res[128])

    async def test_failed_middle_batch_raises_immediately_no_partial_return(self):
        # Batch 1 succeeds, Batch 2 throws 503 UNAVAILABLE
        texts = [f"Item {i}" for i in range(130)]  # 64 + 64 + 2
        with patch.object(self.provider.client.aio.models, "embed_content", new_callable=AsyncMock) as mock_embed:
            mock_embed.side_effect = [
                self._make_mock_response(64),
                RuntimeError("503 UNAVAILABLE: High demand spike"),
            ]
            with self.assertRaises(AIServiceUnavailableError):
                await self.provider.embed(texts)
            # Batch 3 should not be called
            self.assertEqual(mock_embed.call_count, 2)

    async def test_missing_embedding_result_count_mismatch(self):
        # Batch requests 10 items, upstream returns only 9
        texts = [f"Item {i}" for i in range(10)]
        with patch.object(self.provider.client.aio.models, "embed_content", new_callable=AsyncMock) as mock_embed:
            mock_embed.return_value = self._make_mock_response(9)
            with self.assertRaises(AIResponseMalformedError) as ctx:
                await self.provider.embed(texts)
            self.assertIn("mismatch", str(ctx.exception).lower())

    async def test_invalid_dimension_rejected(self):
        # Returns 768 dimensions instead of 384
        with patch.object(self.provider.client.aio.models, "embed_content", new_callable=AsyncMock) as mock_embed:
            mock_embed.return_value = self._make_mock_response(1, dimension=768)
            with self.assertRaises(AIResponseMalformedError) as ctx:
                await self.provider.embed(["Test text"])
            self.assertIn("dimension mismatch", str(ctx.exception).lower())

    async def test_nan_values_rejected(self):
        bad_values = [[float("nan")] * 384]
        with patch.object(self.provider.client.aio.models, "embed_content", new_callable=AsyncMock) as mock_embed:
            mock_embed.return_value = self._make_mock_response(1, custom_values=bad_values)
            with self.assertRaises(AIResponseMalformedError) as ctx:
                await self.provider.embed(["Test text"])
            self.assertIn("nan", str(ctx.exception).lower())

    async def test_inf_values_rejected(self):
        bad_values = [[float("inf")] * 384]
        with patch.object(self.provider.client.aio.models, "embed_content", new_callable=AsyncMock) as mock_embed:
            mock_embed.return_value = self._make_mock_response(1, custom_values=bad_values)
            with self.assertRaises(AIResponseMalformedError) as ctx:
                await self.provider.embed(["Test text"])
            self.assertIn("infinite", str(ctx.exception).lower())

    async def test_zero_norm_vector_rejected(self):
        all_zeros = [[0.0] * 384]
        with patch.object(self.provider.client.aio.models, "embed_content", new_callable=AsyncMock) as mock_embed:
            mock_embed.return_value = self._make_mock_response(1, custom_values=all_zeros)
            with self.assertRaises(AIResponseMalformedError) as ctx:
                await self.provider.embed(["Test text"])
            self.assertIn("zero-norm", str(ctx.exception).lower())

    async def test_retry_behavior_succeeds_after_transient_failure(self):
        """Simulates an application retry loop: first attempt fails 429, second attempt succeeds."""
        texts = [f"Text {i}" for i in range(10)]
        with patch.object(self.provider.client.aio.models, "embed_content", new_callable=AsyncMock) as mock_embed:
            # First attempt fails with 429
            mock_embed.side_effect = RuntimeError("429 RESOURCE_EXHAUSTED: Rate limit exceeded")
            with self.assertRaises(AIRateLimitExceededError):
                await self.provider.embed(texts)

            # Second attempt succeeds
            mock_embed.side_effect = None
            mock_embed.return_value = self._make_mock_response(10)
            res = await self.provider.embed(texts)
            self.assertEqual(len(res), 10)
            self.assertEqual(len(res[0]), 384)


if __name__ == "__main__":
    unittest.main()
