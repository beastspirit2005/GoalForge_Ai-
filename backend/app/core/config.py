import os
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _normalize_async_db_url(url: str) -> str:
    """Render/Heroku provide postgresql:// — SQLAlchemy async needs postgresql+asyncpg://."""
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


class Settings(BaseSettings):
    # Database Settings (PostgreSQL default, fallback to local SQLite)
    # Default: SQLite (zero-setup). Override with PostgreSQL via .env:
    #   DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/goalforge
    DATABASE_URL: str = "sqlite+aiosqlite:///./goalforge.db"
    DATABASE_URL_SYNC: str = "sqlite:///./goalforge.db"

    # Authentication & JWT Config
    SECRET_KEY: str = "goalforge-super-secret-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Gemini AI Core Config
    GEMINI_API_KEY: str = ""

    # Comma-separated browser origins for CORS (Vercel preview + production URLs)
    CORS_ORIGINS: str = ""

    # Redis Configurations (Leave empty to use in-memory sliding window rate limiting)
    REDIS_URL: str = ""

    # Base Application Config
    APP_NAME: str = "GoalForge AI"
    DEBUG: bool = False

    # SMTP Configurations
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "GoalForge AI"

    model_config = SettingsConfigDict(env_file=(".env", "../.env"), extra="ignore")


    @model_validator(mode="after")
    def normalize_db_urls(self):
        db_url = (self.DATABASE_URL or "").strip()
        if not db_url:
            db_url = "sqlite+aiosqlite:///./goalforge.db"
        self.DATABASE_URL = _normalize_async_db_url(db_url)
        
        db_sync = (self.DATABASE_URL_SYNC or "").strip()
        if not db_sync:
            db_sync = "sqlite:///./goalforge.db"
        self.DATABASE_URL_SYNC = db_sync
        
        if self.DATABASE_URL.startswith("postgresql+asyncpg://"):
            self.DATABASE_URL_SYNC = self.DATABASE_URL.replace(
                "postgresql+asyncpg://", "postgresql://", 1
            )
            
        self.SECRET_KEY = (self.SECRET_KEY or "").strip()
        if not self.DEBUG and self.SECRET_KEY in ["goalforge-super-secret-change-in-production", "change-me-in-production", ""]:
            raise ValueError("SECRET_KEY must be set to a secure value in production (DEBUG=False).")
            
        self.GEMINI_API_KEY = (self.GEMINI_API_KEY or "").strip()
        self.CORS_ORIGINS = (self.CORS_ORIGINS or "").strip()
        self.REDIS_URL = (self.REDIS_URL or "").strip()
        
        if not self.DEBUG and (not self.CORS_ORIGINS or "*" in self.cors_origin_list):
            raise ValueError("CORS_ORIGINS must be set to an explicit whitelist in production (DEBUG=False). Wildcard '*' is not permitted.")
            
        return self

    @property
    def cors_origin_list(self) -> list[str]:
        raw = (self.CORS_ORIGINS or os.getenv("FRONTEND_URL", "")).strip()
        if not raw:
            return ["*"]
        return [o.strip().rstrip("/") for o in raw.split(",") if o.strip()]


settings = Settings()
