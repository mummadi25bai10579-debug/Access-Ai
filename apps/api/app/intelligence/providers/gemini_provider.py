import asyncio
import json
import logging
import math
from typing import Any

import httpx
from google import genai
from google.genai import errors, types

from app.core.exceptions import (
    AIAuthenticationError,
    AIInvalidArgumentError,
    AIProviderError,
    AIRateLimitExceededError,
    AIResponseMalformedError,
    AIServiceUnavailableError,
    AITimeoutError,
)
from app.intelligence.providers.base import AIProvider

logger = logging.getLogger(__name__)


class GeminiProvider(AIProvider):
    """
    Google Gemini AI Provider implementing text generation,
    structured JSON generation, and 384-dimensional normalized embeddings.
    """

    def __init__(
        self,
        api_key: str,
        model: str = "gemini-3.8-flash",
        embedding_model: str = "gemini-embedding-001",
        embedding_dimension: int = 384,
        timeout: float = 30.0,
        embedding_batch_size: int = 64,
    ):
        if not api_key or not isinstance(api_key, str) or not api_key.strip():
            raise ValueError("Gemini API key is required and cannot be empty.")

        self.api_key = api_key.strip()
        self.model = model or "gemini-3.8-flash"
        self.embedding_model = embedding_model or "gemini-embedding-001"
        self.embedding_dimension = embedding_dimension
        self.timeout = timeout
        self.embedding_batch_size = max(1, embedding_batch_size)

        # Initialize asynchronous google-genai Client
        http_options = types.HttpOptions(timeout=int(self.timeout * 1000))
        self.client = genai.Client(api_key=self.api_key, http_options=http_options)

    def _sanitize_error(self, err: Exception) -> str:
        """Removes API key from error strings to prevent secret leakage."""
        msg = str(err)
        if self.api_key and self.api_key in msg:
            msg = msg.replace(self.api_key, "[REDACTED_API_KEY]")
        return msg

    def _map_upstream_error(self, err: Exception, operation: str) -> AIProviderError:
        """
        Translates upstream Google GenAI SDK and transport errors into typed domain exceptions.
        Guarantees that credentials are never leaked and stack traces are suppressed.
        """
        clean_msg = self._sanitize_error(err)
        logger.error(f"Gemini {operation} API error: {clean_msg}")

        # 1. Genuine transport / client timeout
        if isinstance(err, (httpx.TimeoutException, asyncio.TimeoutError, TimeoutError)):
            return AITimeoutError(
                message=f"Gemini {operation} timed out while waiting for a response.",
                details={"operation": operation, "diagnostics": clean_msg},
            )

        # 2. google.genai errors.APIError
        if isinstance(err, errors.APIError):
            code = getattr(err, "code", None)
            status = str(getattr(err, "status", "") or "").upper()
            msg = str(getattr(err, "message", "") or "")

            if code == 429 or "RESOURCE_EXHAUSTED" in status:
                return AIRateLimitExceededError(
                    message="Gemini rate limit or quota exceeded. Please retry in a few moments.",
                    details={"upstream_status": status or "RESOURCE_EXHAUSTED", "diagnostics": clean_msg},
                )
            if code == 503 or "UNAVAILABLE" in status:
                return AIServiceUnavailableError(
                    message="The Gemini AI service is temporarily experiencing high demand or is unavailable. Please retry in a few moments.",
                    details={"upstream_status": status or "UNAVAILABLE", "diagnostics": clean_msg},
                )
            if code in (504, 408) or "DEADLINE_EXCEEDED" in status:
                return AITimeoutError(
                    message=f"Gemini {operation} request timed out.",
                    details={"upstream_status": status or "DEADLINE_EXCEEDED", "diagnostics": clean_msg},
                )
            if code in (401, 403) or "UNAUTHENTICATED" in status or "PERMISSION_DENIED" in status:
                return AIAuthenticationError(
                    message=f"Gemini API key is invalid or unauthorized: {clean_msg}",
                    details={"upstream_code": code, "diagnostics": clean_msg},
                )
            if code == 400 and ("api key" in msg.lower() or "api_key" in msg.lower()):
                return AIAuthenticationError(
                    message=f"Gemini API key is invalid or unauthorized: {clean_msg}",
                    details={"upstream_code": 400, "diagnostics": clean_msg},
                )
            if code == 400:
                return AIInvalidArgumentError(
                    message=f"Invalid arguments for Gemini {operation}: {clean_msg}",
                    details={"upstream_code": 400, "diagnostics": clean_msg},
                )
            if code and 500 <= code < 600:
                return AIServiceUnavailableError(
                    message=f"Gemini server error ({code}). Please retry in a few moments.",
                    details={"upstream_code": code, "diagnostics": clean_msg},
                )

        # 3. String-based fallback parsing for wrapped exceptions or mock test strings
        lower_msg = clean_msg.lower()
        if "503" in lower_msg or "unavailable" in lower_msg:
            return AIServiceUnavailableError(
                message=f"Gemini service is temporarily unavailable: {clean_msg}",
                details={"diagnostics": clean_msg},
            )
        if "429" in lower_msg or "resource_exhausted" in lower_msg or "quota" in lower_msg:
            return AIRateLimitExceededError(
                message=f"Gemini rate limit or quota exceeded: {clean_msg}",
                details={"diagnostics": clean_msg},
            )
        if "timeout" in lower_msg or "timed out" in lower_msg or "deadline" in lower_msg:
            return AITimeoutError(
                message=f"Gemini {operation} timed out: {clean_msg}",
                details={"diagnostics": clean_msg},
            )
        if "api key" in lower_msg or "unauthenticated" in lower_msg or "401" in lower_msg or "403" in lower_msg or "forbidden" in lower_msg:
            return AIAuthenticationError(
                message=f"Gemini API key is invalid or unauthorized: {clean_msg}",
                details={"diagnostics": clean_msg},
            )
        if "json" in lower_msg or "malformed" in lower_msg or "decode" in lower_msg:
            return AIResponseMalformedError(
                message=f"Gemini response structure is invalid: {clean_msg}",
                details={"diagnostics": clean_msg},
            )

        return AIProviderError(
            message=f"Gemini {operation} failed: {clean_msg}",
            details={"operation": operation, "diagnostics": clean_msg},
        )

    async def generate(
        self,
        prompt: str,
        system_prompt: str | None = None,
        temperature: float = 0.2,
    ) -> str:
        """Generate plain completion response using Gemini."""
        if not prompt or not prompt.strip():
            raise ValueError("Prompt cannot be empty.")

        config = types.GenerateContentConfig(
            temperature=temperature,
            system_instruction=system_prompt if system_prompt else None,
        )

        try:
            response = await self.client.aio.models.generate_content(
                model=self.model,
                contents=prompt,
                config=config,
            )
            if not response or not response.text:
                raise AIResponseMalformedError("Empty or invalid response received from Gemini API.")
            return response.text.strip()
        except AIProviderError:
            raise
        except Exception as e:
            raise self._map_upstream_error(e, "generation") from None

    @classmethod
    def _validate_json_schema(cls, data: Any, schema: dict[str, Any], path: str = "$") -> None:
        """
        Recursively validates data against a JSON Schema subset supported by Gemini structured outputs.
        Raises AIResponseMalformedError on any schema violation without coercing types.
        """
        if not isinstance(schema, dict):
            return

        expected_type = schema.get("type")

        # 1. Type validation
        if expected_type == "object":
            if not isinstance(data, dict):
                raise AIResponseMalformedError(
                    f"Schema violation at {path}: expected object, got {type(data).__name__}."
                )

            # Check required fields
            required_keys = schema.get("required", [])
            for key in required_keys:
                if key not in data:
                    raise AIResponseMalformedError(
                        f"Schema violation at {path}: missing required field '{key}'."
                    )

            # Check additionalProperties
            if schema.get("additionalProperties") is False:
                allowed_props = set(schema.get("properties", {}).keys())
                for key in data.keys():
                    if key not in allowed_props:
                        raise AIResponseMalformedError(
                            f"Schema violation at {path}: unexpected property '{key}' (additionalProperties is false)."
                        )

            # Recursively validate properties
            properties = schema.get("properties", {})
            for key, prop_schema in properties.items():
                if key in data:
                    cls._validate_json_schema(data[key], prop_schema, path=f"{path}.{key}")

        elif expected_type == "array":
            if not isinstance(data, list):
                raise AIResponseMalformedError(
                    f"Schema violation at {path}: expected array, got {type(data).__name__}."
                )

            item_schema = schema.get("items")
            if item_schema and isinstance(item_schema, dict):
                for idx, item in enumerate(data):
                    cls._validate_json_schema(item, item_schema, path=f"{path}[{idx}]")

        elif expected_type == "string":
            if not isinstance(data, str):
                raise AIResponseMalformedError(
                    f"Schema violation at {path}: expected string, got {type(data).__name__}."
                )

        elif expected_type == "integer":
            if not isinstance(data, int) or isinstance(data, bool):
                raise AIResponseMalformedError(
                    f"Schema violation at {path}: expected integer, got {type(data).__name__}."
                )

        elif expected_type == "number":
            if not isinstance(data, (int, float)) or isinstance(data, bool):
                raise AIResponseMalformedError(
                    f"Schema violation at {path}: expected number, got {type(data).__name__}."
                )

        elif expected_type == "boolean":
            if not isinstance(data, bool):
                raise AIResponseMalformedError(
                    f"Schema violation at {path}: expected boolean, got {type(data).__name__}."
                )

        elif expected_type == "null":
            if data is not None:
                raise AIResponseMalformedError(
                    f"Schema violation at {path}: expected null, got {type(data).__name__}."
                )

        # 2. Enum constraint validation
        if "enum" in schema:
            allowed_enums = schema["enum"]
            if data not in allowed_enums:
                raise AIResponseMalformedError(
                    f"Schema violation at {path}: value {repr(data)} is not in allowed enum {allowed_enums}."
                )

    async def generate_structured(
        self,
        prompt: str,
        schema: dict[str, Any],
        system_prompt: str | None = None,
    ) -> dict[str, Any]:
        """Generate response validated against a target JSON schema with recursive validation."""
        if not prompt or not prompt.strip():
            raise ValueError("Prompt cannot be empty.")
        if not schema or not isinstance(schema, dict):
            raise ValueError("Schema must be a non-empty dictionary.")

        config = types.GenerateContentConfig(
            temperature=0.1,
            system_instruction=system_prompt if system_prompt else None,
            response_mime_type="application/json",
            response_schema=schema,
        )

        try:
            response = await self.client.aio.models.generate_content(
                model=self.model,
                contents=prompt,
                config=config,
            )
            if not response or not response.text:
                raise AIResponseMalformedError("Empty response received from Gemini structured output.")

            text = response.text.strip()
            # Clean markdown code fences if present
            if text.startswith("```json"):
                text = text.removeprefix("```json")
            elif text.startswith("```"):
                text = text.removeprefix("```")
            text = text.removesuffix("```").strip()

            data = json.loads(text)
            if not isinstance(data, dict):
                raise AIResponseMalformedError(f"Expected JSON object output, got {type(data).__name__}.")

            # Full recursive schema validation
            self._validate_json_schema(data, schema, path="$")

            return data
        except json.JSONDecodeError as jde:
            clean_err = self._sanitize_error(jde)
            logger.error(f"Failed to parse Gemini structured JSON: {clean_err}")
            raise AIResponseMalformedError(f"Malformed JSON in Gemini structured output: {clean_err}") from None
        except AIProviderError:
            raise
        except Exception as e:
            raise self._map_upstream_error(e, "structured generation") from None

    async def embed(
        self,
        texts: list[str],
        task_type: str = "RETRIEVAL_DOCUMENT",
    ) -> list[list[float]]:
        """
        Compute dense vector embeddings normalized to unit length in bounded batches.
        Outputs exactly 384 dimensions matching PostgreSQL VECTOR(384).
        """
        if not texts:
            return []

        config = types.EmbedContentConfig(
            task_type=task_type,
            output_dimensionality=self.embedding_dimension,
        )

        all_results: list[list[float]] = []
        batch_size = max(1, self.embedding_batch_size)

        for batch_start in range(0, len(texts), batch_size):
            batch = texts[batch_start : batch_start + batch_size]
            try:
                response = await self.client.aio.models.embed_content(
                    model=self.embedding_model,
                    contents=batch,
                    config=config,
                )

                if not response or not response.embeddings:
                    raise AIResponseMalformedError(
                        f"Empty embedding response received from Gemini API for batch starting at index {batch_start}."
                    )

                if len(response.embeddings) != len(batch):
                    raise AIResponseMalformedError(
                        f"Embedding batch count mismatch: expected {len(batch)} embeddings, got {len(response.embeddings)}."
                    )

                for idx, emb in enumerate(response.embeddings):
                    values = getattr(emb, "values", None)
                    if values is None:
                        raise AIResponseMalformedError(
                            f"Missing embedding vector values for item {batch_start + idx}."
                        )

                    if len(values) != self.embedding_dimension:
                        raise AIResponseMalformedError(
                            f"Vector dimension mismatch at item {batch_start + idx}: expected {self.embedding_dimension}, got {len(values)}."
                        )

                    # Validate no NaN or infinite values
                    if any(math.isnan(x) or math.isinf(x) for x in values):
                        raise AIResponseMalformedError(
                            f"Vector at item {batch_start + idx} contains NaN or infinite values."
                        )

                    # Calculate L2 norm and check for zero-norm
                    norm = math.sqrt(sum(x * x for x in values))
                    if norm == 0.0 or norm < 1e-12:
                        raise AIResponseMalformedError(
                            f"Zero-norm vector at item {batch_start + idx} cannot be normalized."
                        )

                    # Normalize to unit length
                    normalized = [x / norm for x in values]
                    all_results.append(normalized)

            except AIProviderError:
                raise
            except Exception as e:
                raise self._map_upstream_error(e, f"embedding computation batch [{batch_start}:{batch_start+len(batch)}]") from None

        if len(all_results) != len(texts):
            raise AIResponseMalformedError(
                f"Total embeddings generated ({len(all_results)}) does not match input texts ({len(texts)})."
            )

        return all_results
