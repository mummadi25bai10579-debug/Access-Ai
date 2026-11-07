from app.config import settings
from app.intelligence.providers.base import AIProvider
from app.intelligence.providers.mock_provider import MockAIProvider

def get_ai_provider() -> AIProvider:
    """
    Factory returning configured AI Provider.
    Defaults to MockAIProvider in development/test or if no API key is set.
    """
    provider_name = settings.LLM_PROVIDER.lower()
    if provider_name == "mock" or not settings.LLM_API_KEY:
        return MockAIProvider()

    # If OpenAI configured and API key present
    if provider_name == "openai":
        try:
            # We can import OpenAI provider when installed
            from app.intelligence.providers.openai_provider import OpenAIProvider
            return OpenAIProvider(api_key=settings.LLM_API_KEY, model=settings.LLM_MODEL)
        except Exception:
            return MockAIProvider()

    return MockAIProvider()
