import os
from typing import List
from dataclasses import dataclass, field

try:
    from pydantic_settings import BaseSettings
    from pydantic import Field

    class Settings(BaseSettings):
        APP_ENV: str = "development"
        DEBUG: bool = True
        PORT: int = 8000
        HOST: str = "0.0.0.0"
        API_V1_PREFIX: str = "/api/v1"
        CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

        DATABASE_URL: str = "postgresql://postgres:postgrespassword@localhost:5432/accessai"
        SUPABASE_URL: str = "https://example.supabase.co"
        SUPABASE_ANON_KEY: str = "anon-key-placeholder"
        SUPABASE_SERVICE_ROLE_KEY: str = "service-role-key-placeholder"
        SUPABASE_JWT_SECRET: str = "jwt-secret-placeholder"
        STORAGE_BUCKET: str = "accessai-documents"

        LLM_PROVIDER: str = "mock"
        LLM_API_KEY: str = ""
        LLM_MODEL: str = "gpt-4o-mini"
        EMBEDDING_PROVIDER: str = "sentence-transformers"
        EMBEDDING_MODEL: str = "paraphrase-multilingual-MiniLM-L12-v2"
        EMBEDDING_DIMENSION: int = 384

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
        CORS_ORIGINS: List[str] = field(default_factory=lambda: ["http://localhost:3000", "http://127.0.0.1:3000"])

        DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgrespassword@localhost:5432/accessai")
        SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://example.supabase.co")
        SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "anon-key-placeholder")
        SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key-placeholder")
        SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "jwt-secret-placeholder")
        STORAGE_BUCKET: str = os.getenv("STORAGE_BUCKET", "accessai-documents")

        LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "mock")
        LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
        LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o-mini")
        EMBEDDING_PROVIDER: str = os.getenv("EMBEDDING_PROVIDER", "sentence-transformers")
        EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "paraphrase-multilingual-MiniLM-L12-v2")
        EMBEDDING_DIMENSION: int = int(os.getenv("EMBEDDING_DIMENSION", "384"))

        RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
        LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

settings = Settings()
