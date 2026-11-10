from typing import Any, Dict, Optional

class AccessAIException(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 400,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)

class DocumentNotFoundError(AccessAIException):
    def __init__(self, document_id: str):
        super().__init__(
            code="DOCUMENT_NOT_FOUND",
            message=f"Document '{document_id}' was not found or access was denied.",
            status_code=404,
            details={"document_id": document_id},
        )

class UnauthorizedError(AccessAIException):
    def __init__(self, message: str = "Invalid or expired authentication credentials."):
        super().__init__(
            code="UNAUTHORIZED",
            message=message,
            status_code=401,
        )

class ForbiddenError(AccessAIException):
    def __init__(self, message: str = "You do not have permission to access this resource."):
        super().__init__(
            code="FORBIDDEN",
            message=message,
            status_code=403,
        )

class ValidationError(AccessAIException):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            code="VALIDATION_ERROR",
            message=message,
            status_code=422,
            details=details,
        )

class SchemeNotFoundError(AccessAIException):
    def __init__(self, scheme_id: str):
        super().__init__(
            code="SCHEME_NOT_FOUND",
            message=f"Scheme '{scheme_id}' was not found.",
            status_code=404,
            details={"scheme_id": scheme_id},
        )

class OpportunityNotFoundError(AccessAIException):
    def __init__(self, opportunity_id: str):
        super().__init__(
            code="OPPORTUNITY_NOT_FOUND",
            message=f"Opportunity '{opportunity_id}' was not found.",
            status_code=404,
            details={"opportunity_id": opportunity_id},
        )


# -----------------------------------------------------------------------------
# Upstream AI Provider Exceptions
# -----------------------------------------------------------------------------

class AIProviderError(AccessAIException, RuntimeError):
    """Base exception for all AI provider and upstream model communication failures."""
    def __init__(
        self,
        message: str = "An error occurred while communicating with the AI service.",
        code: str = "AI_PROVIDER_ERROR",
        status_code: int = 502,
        details: Optional[Dict[str, Any]] = None,
    ):
        AccessAIException.__init__(self, code=code, message=message, status_code=status_code, details=details)
        RuntimeError.__init__(self, message)


class AIServiceUnavailableError(AIProviderError):
    """Raised when upstream AI service (e.g. Gemini) returns 503 or experiences capacity spikes."""
    def __init__(
        self,
        message: str = "The AI service is temporarily experiencing high demand or is unavailable. Please retry in a few moments.",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            code="AI_SERVICE_UNAVAILABLE",
            status_code=503,
            details=details,
        )


class AIRateLimitExceededError(AIProviderError):
    """Raised when upstream AI service returns 429 (rate limit or quota exhausted)."""
    def __init__(
        self,
        message: str = "AI service rate limit or quota exceeded. Please retry shortly.",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            code="AI_RATE_LIMIT_EXCEEDED",
            status_code=429,
            details=details,
        )


class AITimeoutError(AIProviderError):
    """Raised when upstream AI service request times out (HTTP 504 or deadline exceeded)."""
    def __init__(
        self,
        message: str = "AI processing timed out while waiting for a response from the service.",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            code="AI_TIMEOUT",
            status_code=504,
            details=details,
        )


class AIResponseMalformedError(AIProviderError, ValueError):
    """Raised when upstream AI returns an unparseable or invalid response structure."""
    def __init__(
        self,
        message: str = "The AI service returned an unparseable or malformed response.",
        details: Optional[Dict[str, Any]] = None,
    ):
        AIProviderError.__init__(
            self,
            message=message,
            code="AI_RESPONSE_MALFORMED",
            status_code=502,
            details=details,
        )
        ValueError.__init__(self, message)


class AIAuthenticationError(AIProviderError):
    """Raised when upstream AI service rejects API key or authentication credentials."""
    def __init__(
        self,
        message: str = "Authentication failed with the AI service. Please verify your API key.",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            code="AI_AUTHENTICATION_ERROR",
            status_code=502,
            details=details,
        )


class AIInvalidArgumentError(AIProviderError, ValueError):
    """Raised when upstream AI service rejects arguments or batch limits."""
    def __init__(
        self,
        message: str = "Invalid parameters provided to the AI service.",
        details: Optional[Dict[str, Any]] = None,
    ):
        AIProviderError.__init__(
            self,
            message=message,
            code="AI_INVALID_ARGUMENT",
            status_code=422,
            details=details,
        )
        ValueError.__init__(self, message)

