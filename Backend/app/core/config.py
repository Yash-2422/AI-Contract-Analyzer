"""
Centralized application configuration.

Every environment variable the app depends on is declared here with a type
and (where safe) a default. Pydantic validates these at startup, so a missing
or malformed env var fails fast with a clear error instead of blowing up
somewhere deep in a service at runtime.
"""

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- App metadata ---
    APP_NAME: str = "AI Contract Analyzer"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"  # development | staging | production
    DEBUG: bool = True

    # --- API ---
    API_V1_PREFIX: str = "/api/v1"
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # --- Database ---
    DATABASE_URL: str = (
        "postgresql+psycopg2://postgres:postgres@localhost:5432/contract_analyzer"
    )
    DB_ECHO: bool = False

    # --- Redis (optional, used later for caching / celery) ---
    REDIS_URL: str = "redis://localhost:6379/0"

    # --- Auth (wired up in Phase 2) ---
    JWT_SECRET_KEY: str = "change-this-in-.env-never-commit-a-real-secret"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # --- Rate limiting ---
    # Disabled in tests (see tests/conftest.py) since TestClient requests
    # all share one address and would trip shared limits for reasons
    # unrelated to what a given test is checking.
    RATE_LIMIT_ENABLED: bool = True

    # --- File storage ---
    UPLOAD_DIR: str = "storage/uploads"
    MAX_UPLOAD_SIZE_MB: int = 25
    REPORTS_DIR: str = "storage/reports"

    # --- AI / LLM (wired up in Phase 5) ---
    # LLM_PROVIDER switches the text-generation backend:
    #   "ollama" -> local Ollama server (default, used on your laptop)
    #   "groq"   -> alternate hosted OpenAI-compatible API
    #   "gemini" -> hosted Gemini API (selected for production)
    LLM_PROVIDER: Literal["ollama", "groq", "gemini"] = "ollama"

    OLLAMA_BASE_URL: str = "http://localhost:11434"
    LLM_MODEL_NAME: str = "qwen2.5:7b-instruct"

    GROQ_API_KEY: str = ""
    GROQ_MODEL_NAME: str = "openai/gpt-oss-120b"
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"

    GEMINI_API_KEY: str = ""
    GEMINI_MODEL_NAME: str = "gemini-3.1-flash-lite"
    GEMINI_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta/openai"

    # Local development keeps PaddleOCR; hosted deployments can send only
    # scanned page images to the already-configured Gemini API.
    OCR_PROVIDER: Literal["local", "gemini"] = "local"

    # Local BGE remains the default. Hosted deployments can use Gemini to
    # avoid loading the BGE model into the limited free-service memory.
    EMBEDDING_PROVIDER: Literal["local", "gemini"] = "local"
    EMBEDDING_MODEL_NAME: str = "BAAI/bge-small-en-v1.5"
    GEMINI_EMBEDDING_MODEL_NAME: str = "gemini-embedding-2"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [
            origin
            for item in self.ALLOWED_ORIGINS.split(",")
            if (origin := item.strip())
        ]


@lru_cache
def get_settings() -> Settings:
    """
    Cached settings accessor. Using lru_cache means the .env file is parsed
    once per process, and every part of the app (via Depends(get_settings)
    or a direct call) shares the same Settings instance.
    """
    return Settings()


settings = get_settings()
