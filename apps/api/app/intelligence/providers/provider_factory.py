from app.config import settings
from app.intelligence.providers.base import AIProvider
from app.intelligence.providers.mock_provider import MockAIProvider


def get_ai_provider() -> AIProvider:
    """
    Factory returning the configured AI Provider.
    
    Supports:
      - 'gemini' / 'google': Uses Google Gemini SDK (gemini-3.8-flash, gemini-embedding-001).
      - 'mock': Explicitly selected deterministic mock provider for testing and offline runs.
      - 'openai': OpenAI provider when configured.

    Raises:
      - ValueError: If a live provider (gemini/google/openai) is configured without
        an API key, or if an unsupported provider name is specified.
    """
    provider_name = (settings.LLM_PROVIDER or "mock").strip().lower()

    # Explicit test/development mock provider
    if provider_name == "mock":
        return MockAIProvider()

    # Google Gemini provider
    if provider_name in ("gemini", "google"):
        api_key = (settings.LLM_API_KEY or "").strip()
        if not api_key:
            raise ValueError(
                "LLM_API_KEY is required and cannot be empty when LLM_PROVIDER is configured for Gemini/Google."
            )

        from app.intelligence.providers.gemini_provider import GeminiProvider

        return GeminiProvider(
            api_key=api_key,
            model=settings.LLM_MODEL or "gemini-3.8-flash",
            embedding_model=getattr(settings, "EMBEDDING_MODEL", "gemini-embedding-001"),
            embedding_dimension=getattr(settings, "EMBEDDING_DIMENSION", 384),
            embedding_batch_size=getattr(settings, "EMBEDDING_BATCH_SIZE", 64),
        )

    # OpenAI provider
    if provider_name == "openai":
        api_key = (settings.LLM_API_KEY or "").strip()
        if not api_key:
            raise ValueError(
                "LLM_API_KEY is required and cannot be empty when LLM_PROVIDER is configured for OpenAI."
            )

        try:
            from app.intelligence.providers.openai_provider import OpenAIProvider
            return OpenAIProvider(api_key=api_key, model=settings.LLM_MODEL)
        except ImportError:
            raise RuntimeError("OpenAI provider requested but openai package is not installed.")

    raise ValueError(
        f"Unsupported LLM_PROVIDER: '{settings.LLM_PROVIDER}'. "
        "Supported providers: 'gemini', 'google', 'mock', 'openai'."
    )
