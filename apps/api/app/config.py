import os
import base64
from typing import List
from dataclasses import dataclass, field

def _load_env_file():
    """Lightweight .env loader that populates os.environ without external dependencies."""
    for candidate in [".env", "../.env", "../../.env", "apps/api/.env"]:
        if os.path.exists(candidate) and os.path.isfile(candidate):
            try:
                with open(candidate, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k = k.strip()
                            v = v.strip().strip("'\"")
                            if k not in os.environ:
                                os.environ[k] = v
                break
            except Exception:
                pass

_load_env_file()

def _derive_clerk_endpoints(publishable_key: str):
    """Auto-derives Clerk issuer and JWKS URL from publishable key if omitted."""
    if not publishable_key:
        return "", ""
    try:
        key_body = publishable_key.replace("pk_test_", "").replace("pk_live_", "")
        padding = "=" * ((4 - len(key_body) % 4) % 4)
        frontend_api = base64.b64decode(key_body + padding).decode("utf-8").rstrip("$")
        if frontend_api:
            issuer = f"https://{frontend_api}"
            jwks_url = f"https://{frontend_api}/.well-known/jwks.json"
            return issuer, jwks_url
    except Exception:
        pass
    return "", ""

try:
    from pydantic_settings import BaseSettings
    from pydantic import Field, field_validator

    class Settings(BaseSettings):
        APP_ENV: str = "development"
        DEBUG: bool = True
        PORT: int = 8000
        HOST: str = "0.0.0.0"
        API_V1_PREFIX: str = "/api/v1"
        CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

        @field_validator("CORS_ORIGINS", mode="before")
        @classmethod
        def assemble_cors_origins(cls, v):
            if isinstance(v, str):
                if v.startswith("[") and v.endswith("]"):
                    import json
                    try:
                        return json.loads(v)
                    except Exception:
                        pass
                return [i.strip() for i in v.split(",") if i.strip()]
            return v

        DATABASE_URL: str = "postgresql://postgres:postgrespassword@localhost:5432/accessai"
        SUPABASE_URL: str = "https://example.supabase.co"
        SUPABASE_ANON_KEY: str = "anon-key-placeholder"
        SUPABASE_SERVICE_ROLE_KEY: str = "service-role-key-placeholder"
        SUPABASE_JWT_SECRET: str = "jwt-secret-placeholder"
        STORAGE_BUCKET: str = "accessai-documents"

        # Clerk Authentication
        CLERK_SECRET_KEY: str = ""
        CLERK_PUBLISHABLE_KEY: str = ""
        CLERK_ISSUER: str = ""
        CLERK_JWKS_URL: str = ""
        CLERK_PEM_PUBLIC_KEY: str = ""

        LLM_PROVIDER: str = "mock"
        LLM_API_KEY: str = ""
        LLM_MODEL: str = "gemini-3.5-flash"
        EMBEDDING_PROVIDER: str = "gemini"
        EMBEDDING_MODEL: str = "gemini-embedding-001"
        EMBEDDING_DIMENSION: int = 384
        EMBEDDING_BATCH_SIZE: int = 64

        RATE_LIMIT_PER_MINUTE: int = 60
        LOG_LEVEL: str = "INFO"

        class Config:
            env_file = ".env"
            extra = "ignore"

except ImportError:
    @dataclass
    class Settings:
        APP_ENV: str = os.getenv("APP_ENV", "development")
        DEBUG: bool = os.getenv("DEBUG", "true").lower() in ("true", "1")
        PORT: int = int(os.getenv("PORT", "8000"))
        HOST: str = os.getenv("HOST", "0.0.0.0")
        API_V1_PREFIX: str = "/api/v1"
        CORS_ORIGINS: List[str] = field(default_factory=lambda: (
            [i.strip() for i in os.getenv("CORS_ORIGINS", "").split(",") if i.strip()]
            if os.getenv("CORS_ORIGINS")
            else ["http://localhost:3000", "http://127.0.0.1:3000"]
        ))

        DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgrespassword@localhost:5432/accessai")
        SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://example.supabase.co")
        SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "anon-key-placeholder")
        SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key-placeholder")
        SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "jwt-secret-placeholder")
        STORAGE_BUCKET: str = os.getenv("STORAGE_BUCKET", "accessai-documents")

        # Clerk Authentication
        CLERK_SECRET_KEY: str = os.getenv("CLERK_SECRET_KEY", "")
        CLERK_PUBLISHABLE_KEY: str = os.getenv("CLERK_PUBLISHABLE_KEY", "")
        CLERK_ISSUER: str = os.getenv("CLERK_ISSUER", "")
        CLERK_JWKS_URL: str = os.getenv("CLERK_JWKS_URL", "")
        CLERK_PEM_PUBLIC_KEY: str = os.getenv("CLERK_PEM_PUBLIC_KEY", "")

        LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "mock")
        LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
        LLM_MODEL: str = os.getenv("LLM_MODEL", "gemini-3.5-flash")
        EMBEDDING_PROVIDER: str = os.getenv("EMBEDDING_PROVIDER", "gemini")
        EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "gemini-embedding-001")
        EMBEDDING_DIMENSION: int = int(os.getenv("EMBEDDING_DIMENSION", "384"))
        EMBEDDING_BATCH_SIZE: int = int(os.getenv("EMBEDDING_BATCH_SIZE", "64"))

        RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
        LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

settings = Settings()

if settings.CLERK_PUBLISHABLE_KEY and (not settings.CLERK_ISSUER or not settings.CLERK_JWKS_URL):
    derived_issuer, derived_jwks = _derive_clerk_endpoints(settings.CLERK_PUBLISHABLE_KEY)
    if not settings.CLERK_ISSUER and derived_issuer:
        settings.CLERK_ISSUER = derived_issuer
    if not settings.CLERK_JWKS_URL and derived_jwks:
        settings.CLERK_JWKS_URL = derived_jwks

