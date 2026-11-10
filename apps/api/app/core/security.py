import jwt
from jwt import PyJWKClient, PyJWKClientError, InvalidTokenError, ExpiredSignatureError
from typing import Dict, Any, Optional
from app.config import settings
from app.core.exceptions import UnauthorizedError
from app.core.logging import get_logger

logger = get_logger(__name__)

# Cached PyJWKClient instance for Clerk JWKS public keys
_jwks_client: Optional[PyJWKClient] = None

def get_jwks_client() -> Optional[PyJWKClient]:
    """
    Returns or initializes the singleton PyJWKClient for Clerk JWKS keys.
    Caches keys for 1 hour to minimize latency and network overhead.
    """
    global _jwks_client
    if _jwks_client is not None:
        return _jwks_client

    jwks_url = settings.CLERK_JWKS_URL
    if not jwks_url and settings.CLERK_ISSUER:
        jwks_url = f"{settings.CLERK_ISSUER.rstrip('/')}/.well-known/jwks.json"

    if jwks_url:
        _jwks_client = PyJWKClient(jwks_url, cache_keys=True, lifespan=3600)
        return _jwks_client
    return None

def verify_jwt_token(token: str) -> Dict[str, Any]:
    """
    Validates Clerk JWT session token.
    Enforces signature verification via Clerk JWKS endpoint or direct PEM public key.
    Validates RS256 algorithm, expiration, and extracts the verified string Clerk user ID ('sub').
    Rejects missing, invalid, expired, or malformed tokens with HTTP 401.
    """
    if not token or not isinstance(token, str):
        raise UnauthorizedError("Missing authentication token.")

    # Remove 'Bearer ' prefix if passed
    if token.lower().startswith("bearer "):
        token = token[7:].strip()

    if not token:
        raise UnauthorizedError("Empty bearer token provided.")

    # Development & test tokens for reproducible automated unit testing
    if settings.APP_ENV == "development" and (token.startswith("test-token-") or token.startswith("clerk-test-")):
        user_id = token.replace("test-token-", "").replace("clerk-test-", "")
        return {
            "sub": user_id,
            "id": user_id,
            "clerk_user_id": user_id,
            "email": f"{user_id}@accessai.local",
            "role": "authenticated",
        }

    try:
        # 1. Inspect unverified header for algorithm and kid
        header = jwt.get_unverified_header(token)
        alg = header.get("alg")
        if alg != "RS256":
            logger.warning(f"Rejected token with unauthorized algorithm: {alg}")
            raise UnauthorizedError(f"Unsupported signing algorithm: {alg}. Expected RS256.")

        kid = header.get("kid")
        if not kid:
            raise UnauthorizedError("Token header missing key identifier ('kid').")

        # 2. Obtain verification key
        signing_key = None
        if settings.CLERK_PEM_PUBLIC_KEY:
            signing_key = settings.CLERK_PEM_PUBLIC_KEY
        else:
            jwk_client = get_jwks_client()
            if not jwk_client:
                raise UnauthorizedError("Clerk JWKS URL / Issuer not configured on server.")
            signing_key = jwk_client.get_signing_key_from_jwt(token).key

        # 3. Decode & verify signature, expiration, and issuer
        decode_kwargs: Dict[str, Any] = {
            "algorithms": ["RS256"],
            "options": {"verify_exp": True, "verify_signature": True},
        }
        if settings.CLERK_ISSUER:
            decode_kwargs["issuer"] = settings.CLERK_ISSUER

        payload = jwt.decode(token, signing_key, **decode_kwargs)

        sub = payload.get("sub")
        if not sub:
            raise UnauthorizedError("Token payload missing subject ('sub') claim.")

        payload["clerk_user_id"] = sub
        payload["id"] = sub
        return payload

    except ExpiredSignatureError:
        raise UnauthorizedError("Authentication token has expired.")
    except (PyJWKClientError, InvalidTokenError) as e:
        logger.warning(f"Failed JWT verification: {e}")
        raise UnauthorizedError(f"Invalid authentication token: {str(e)}")
    except UnauthorizedError:
        raise
    except Exception as e:
        logger.error(f"Unexpected token verification error: {e}")
        raise UnauthorizedError("Authentication failed.")
