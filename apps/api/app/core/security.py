import jwt
from typing import Dict, Any, Optional
from app.config import settings
from app.core.exceptions import UnauthorizedError
from app.core.logging import get_logger

logger = get_logger(__name__)

def verify_jwt_token(token: str) -> Dict[str, Any]:
    """
    Validates Supabase / standard JWT token.
    In development mode with mock credentials, allows valid synthetic tokens for testing.
    """
    if not token:
        raise UnauthorizedError("Missing authentication token.")

    # Remove 'Bearer ' prefix if passed
    if token.lower().startswith("bearer "):
        token = token[7:]

    # Development convenience: if mock token is used
    if settings.APP_ENV == "development" and token.startswith("test-token-"):
        user_id = token.replace("test-token-", "")
        return {
            "sub": user_id,
            "id": user_id,
            "email": f"{user_id}@accessai.local",
            "role": "authenticated",
        }

    try:
        # Standard Supabase JWT verification
        decoded = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        return decoded
    except jwt.ExpiredSignatureError:
        raise UnauthorizedError("Authentication token has expired.")
    except jwt.InvalidTokenError as e:
        logger.warning(f"Failed JWT verification: {e}")
        raise UnauthorizedError("Invalid authentication token.")
