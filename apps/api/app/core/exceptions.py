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
