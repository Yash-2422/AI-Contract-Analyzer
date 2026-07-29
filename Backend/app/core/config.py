"""
Centralized application configuration.

Every environment variable the app depends on is declared here with a type
and (where safe) a default. Pydantic validates these at startup, so a missing
or malformed env var fails fast with a clear error instead of blowing up
somewhere deep in a service at runtime.
"""

from functools import lru_cache
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

    # --- File storage ---
    UPLOAD_DIR: str = "storage/uploads"
    MAX_UPLOAD_SIZE_MB: int = 25

    # --- AI / LLM (wired up in Phase 5) ---
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    LLM_MODEL_NAME: str = "llama3.2:3b"
    EMBEDDING_MODEL_NAME: str = "BAAI/bge-small-en-v1.5"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]


@lru_cache
def get_settings() -> Settings:
    """
    Cached settings accessor. Using lru_cache means the .env file is parsed
    once per process, and every part of the app (via Depends(get_settings)
    or a direct call) shares the same Settings instance.
    """
    return Settings()


settings = get_settings()