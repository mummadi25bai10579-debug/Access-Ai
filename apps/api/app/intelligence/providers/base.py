from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class AIProvider(ABC):
    """
    Abstract AI Provider interface preventing vendor lock-in.
    Implemented by OpenAIProvider, LocalProvider, and MockProvider.
    """

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
    ) -> str:
        """Generate plain completion response."""
        pass

    @abstractmethod
    async def generate_structured(
        self,
        prompt: str,
        schema: Dict[str, Any],
        system_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate response validated against a target JSON schema."""
        pass

    @abstractmethod
    async def embed(
        self,
        texts: List[str],
    ) -> List[List[float]]:
        """Compute dense vector embeddings (384 dimensions)."""
        pass
