import asyncio
import unittest
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
from google.genai import errors
from starlette.testclient import TestClient

from app.core.exceptions import (
    AccessAIException,
    AIAuthenticationError,
    AIProviderError,
    AIRateLimitExceededError,
    AIResponseMalformedError,
    AIServiceUnavailableError,
    AITimeoutError,
)
from app.intelligence.providers.gemini_provider import GeminiProvider
from app.main import app


class TestAIExceptionMapping(unittest.IsolatedAsyncioTestCase):
    """Verifies that upstream Gemini SDK and transport errors map to typed AccessAI domain exceptions."""

    def setUp(self):
        self.api_key = "super-secret-gemini-key-12345"
        self.provider = GeminiProvider(
            api_key=self.api_key,
            model="gemini-3.5-flash",
            embedding_model="gemini-embedding-001",
        )

    async def test_gemini_429_maps_to_rate_limit_error(self):
        err = errors.ClientError(429, {"error": {"code": 429, "message": "Resource exhausted", "status": "RESOURCE_EXHAUSTED"}})
        with patch.object(self.provider.client.aio.models, "generate_content", new_callable=AsyncMock, side_effect=err):
            with self.assertRaises(AIRateLimitExceededError) as ctx:
                await self.provider.generate("Test prompt")
            self.assertEqual(ctx.exception.status_code, 429)
            self.assertEqual(ctx.exception.code, "AI_RATE_LIMIT_EXCEEDED")
            self.assertIsInstance(ctx.exception, AccessAIException)
            self.assertIsInstance(ctx.exception, RuntimeError)

    async def test_gemini_503_maps_to_service_unavailable_error(self):
        err = errors.ServerError(503, {"error": {"code": 503, "message": "High demand spike", "status": "UNAVAILABLE"}})
        with patch.object(self.provider.client.aio.models, "generate_content", new_callable=AsyncMock, side_effect=err):
            with self.assertRaises(AIServiceUnavailableError) as ctx:
                await self.provider.generate("Test prompt")
            self.assertEqual(ctx.exception.status_code, 503)
            self.assertEqual(ctx.exception.code, "AI_SERVICE_UNAVAILABLE")
            self.assertIsInstance(ctx.exception, AccessAIException)

    async def test_gemini_timeout_maps_to_timeout_error(self):
        err = httpx.ReadTimeout("Client timed out after 30000ms waiting for response")
        with patch.object(self.provider.client.aio.models, "generate_content", new_callable=AsyncMock, side_effect=err):
            with self.assertRaises(AITimeoutError) as ctx:
                await self.provider.generate("Test prompt")
            self.assertEqual(ctx.exception.status_code, 504)
            self.assertEqual(ctx.exception.code, "AI_TIMEOUT")
            self.assertIsInstance(ctx.exception, AccessAIException)

    async def test_gemini_deadline_exceeded_maps_to_timeout_error(self):
        err = errors.ServerError(504, {"error": {"code": 504, "message": "Deadline exceeded", "status": "DEADLINE_EXCEEDED"}})
        with patch.object(self.provider.client.aio.models, "generate_content", new_callable=AsyncMock, side_effect=err):
            with self.assertRaises(AITimeoutError) as ctx:
                await self.provider.generate("Test prompt")
            self.assertEqual(ctx.exception.status_code, 504)

    async def test_gemini_malformed_structured_response(self):
        mock_resp = MagicMock()
        mock_resp.text = "This is not valid JSON at all {"
        with patch.object(self.provider.client.aio.models, "generate_content", new_callable=AsyncMock, return_value=mock_resp):
            with self.assertRaises(AIResponseMalformedError) as ctx:
                await self.provider.generate_structured("prompt", {"type": "object"})
            self.assertEqual(ctx.exception.status_code, 502)
            self.assertEqual(ctx.exception.code, "AI_RESPONSE_MALFORMED")
            self.assertIsInstance(ctx.exception, ValueError)

    async def test_gemini_missing_required_schema_field(self):
        mock_resp = MagicMock()
        mock_resp.text = '{"optional_field": "val"}'
        schema = {"type": "object", "properties": {"req_field": {"type": "string"}}, "required": ["req_field"]}
        with patch.object(self.provider.client.aio.models, "generate_content", new_callable=AsyncMock, return_value=mock_resp):
            with self.assertRaises(AIResponseMalformedError) as ctx:
                await self.provider.generate_structured("prompt", schema)
            self.assertEqual(ctx.exception.status_code, 502)
            self.assertEqual(ctx.exception.code, "AI_RESPONSE_MALFORMED")

    async def test_gemini_invalid_api_key_maps_to_auth_error(self):
        err = errors.ClientError(400, {"error": {"code": 400, "message": "API key not valid. Please pass a valid API key.", "status": "INVALID_ARGUMENT"}})
        with patch.object(self.provider.client.aio.models, "generate_content", new_callable=AsyncMock, side_effect=err):
            with self.assertRaises(AIAuthenticationError) as ctx:
                await self.provider.generate("Test prompt")
            self.assertEqual(ctx.exception.status_code, 502)
            self.assertEqual(ctx.exception.code, "AI_AUTHENTICATION_ERROR")

    async def test_gemini_permission_denied_maps_to_auth_error(self):
        err = errors.ClientError(403, {"error": {"code": 403, "message": "Permission denied for model", "status": "PERMISSION_DENIED"}})
        with patch.object(self.provider.client.aio.models, "generate_content", new_callable=AsyncMock, side_effect=err):
            with self.assertRaises(AIAuthenticationError) as ctx:
                await self.provider.generate("Test prompt")
            self.assertEqual(ctx.exception.status_code, 502)

    async def test_gemini_unknown_upstream_error_maps_to_provider_error(self):
        err = Exception("Unexpected network socket drop without HTTP code")
        with patch.object(self.provider.client.aio.models, "generate_content", new_callable=AsyncMock, side_effect=err):
            with self.assertRaises(AIProviderError) as ctx:
                await self.provider.generate("Test prompt")
            self.assertEqual(ctx.exception.status_code, 502)
            self.assertEqual(ctx.exception.code, "AI_PROVIDER_ERROR")

    async def test_secret_redaction_in_all_mapped_exceptions(self):
        raw_error_message = f"Error 403: Forbidden with key {self.api_key} on upstream URL"
        with patch.object(self.provider.client.aio.models, "generate_content", new_callable=AsyncMock, side_effect=Exception(raw_error_message)):
            with self.assertRaises(AIProviderError) as ctx:
                await self.provider.generate("Test prompt")
            err_str = str(ctx.exception)
            self.assertNotIn(self.api_key, err_str)
            self.assertIn("[REDACTED_API_KEY]", err_str)


class TestFastAPIExceptionHandling(unittest.TestCase):
    """Verifies that FastAPI exception handlers and middleware return correct status and bodies."""

    def setUp(self):
        self.client = TestClient(app)
        self.auth_headers = {"Authorization": "Bearer test-token-test-user-exceptions"}

    def test_http_503_response_body_and_status(self):
        with patch("app.modules.access.service.AccessService.ask_document", new_callable=AsyncMock) as mock_ask:
            mock_ask.side_effect = AIServiceUnavailableError("The AI service is experiencing high demand.")
            res = self.client.post(
                "/api/v1/access/ask",
                headers=self.auth_headers,
                json={"document_id": "00000000-0000-0000-0000-000000000001", "question": "test", "language": "en"},
            )
            self.assertEqual(res.status_code, 503)
            data = res.json()
            self.assertFalse(data["success"])
            self.assertEqual(data["error"]["code"], "AI_SERVICE_UNAVAILABLE")
            self.assertIn("high demand", data["error"]["message"])
            self.assertIn("request_id", data)

    def test_http_429_response_body_and_status(self):
        with patch("app.modules.access.service.AccessService.ask_document", new_callable=AsyncMock) as mock_ask:
            mock_ask.side_effect = AIRateLimitExceededError("Rate limit exceeded.")
            res = self.client.post(
                "/api/v1/access/ask",
                headers=self.auth_headers,
                json={"document_id": "00000000-0000-0000-0000-000000000001", "question": "test", "language": "en"},
            )
            self.assertEqual(res.status_code, 429)
            data = res.json()
            self.assertFalse(data["success"])
            self.assertEqual(data["error"]["code"], "AI_RATE_LIMIT_EXCEEDED")

    def test_http_504_timeout_response_body_and_status(self):
        with patch("app.modules.access.service.AccessService.ask_document", new_callable=AsyncMock) as mock_ask:
            mock_ask.side_effect = AITimeoutError("Request timed out.")
            res = self.client.post(
                "/api/v1/access/ask",
                headers=self.auth_headers,
                json={"document_id": "00000000-0000-0000-0000-000000000001", "question": "test", "language": "en"},
            )
            self.assertEqual(res.status_code, 504)
            data = res.json()
            self.assertFalse(data["success"])
            self.assertEqual(data["error"]["code"], "AI_TIMEOUT")

    def test_http_502_malformed_response_body_and_status(self):
        with patch("app.modules.access.service.AccessService.ask_document", new_callable=AsyncMock) as mock_ask:
            mock_ask.side_effect = AIResponseMalformedError("Invalid JSON structure.")
            res = self.client.post(
                "/api/v1/access/ask",
                headers=self.auth_headers,
                json={"document_id": "00000000-0000-0000-0000-000000000001", "question": "test", "language": "en"},
            )
            self.assertEqual(res.status_code, 502)
            data = res.json()
            self.assertFalse(data["success"])
            self.assertEqual(data["error"]["code"], "AI_RESPONSE_MALFORMED")

    def test_http_502_authentication_error_body_and_status(self):
        with patch("app.modules.access.service.AccessService.ask_document", new_callable=AsyncMock) as mock_ask:
            mock_ask.side_effect = AIAuthenticationError("Invalid API key.")
            res = self.client.post(
                "/api/v1/access/ask",
                headers=self.auth_headers,
                json={"document_id": "00000000-0000-0000-0000-000000000001", "question": "test", "language": "en"},
            )
            self.assertEqual(res.status_code, 502)
            data = res.json()
            self.assertFalse(data["success"])
            self.assertEqual(data["error"]["code"], "AI_AUTHENTICATION_ERROR")


if __name__ == "__main__":
    unittest.main()

