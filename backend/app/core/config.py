from __future__ import annotations
import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]
ROOT_DIR = BACKEND_DIR.parent

for env_path in (BACKEND_DIR / ".env", ROOT_DIR / ".env"):
    load_dotenv(env_path)


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
    #   DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5433/goalforge
    DATABASE_URL: str = "sqlite+aiosqlite:///./goalforge.db"
    DATABASE_URL_SYNC: str = "sqlite:///./goalforge.db"

    # Authentication & JWT Config
    SECRET_KEY: str = "goalforge-super-secret-change-in-production"
    JWT_SECRET_KEY: str = ""
    AUDIT_HMAC_KEY: str = ""
    METRICS_TOKEN: str = ""
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
    DEMO_MODE: bool = False

    # SMTP Configurations
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "GoalForge AI"

    model_config = SettingsConfigDict(
        env_file=(ROOT_DIR / ".env", BACKEND_DIR / ".env"),
        extra="ignore",
    )


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
            # asyncpg requires ssl=require instead of sslmode=require
            self.DATABASE_URL = self.DATABASE_URL.replace("sslmode=require", "ssl=require")
            
        self.SECRET_KEY = (self.SECRET_KEY or "").strip()
        if not self.DEBUG and self.SECRET_KEY in ["goalforge-super-secret-change-in-production", "change-me-in-production", ""]:
            raise ValueError("SECRET_KEY must be set to a secure value in production (DEBUG=False).")

        self.JWT_SECRET_KEY = (self.JWT_SECRET_KEY or "").strip()
        if not self.JWT_SECRET_KEY:
            self.JWT_SECRET_KEY = self.SECRET_KEY

        self.AUDIT_HMAC_KEY = (self.AUDIT_HMAC_KEY or "").strip()
        if not self.AUDIT_HMAC_KEY:
            self.AUDIT_HMAC_KEY = self.SECRET_KEY

        self.METRICS_TOKEN = (self.METRICS_TOKEN or "").strip()
        if not self.DEBUG and not self.METRICS_TOKEN:
            raise ValueError("METRICS_TOKEN must be set to a secure value in production (DEBUG=False).")

        if not self.DEBUG and self.DATABASE_URL.startswith("sqlite"):
            raise ValueError("SQLite is not supported in production (DEBUG=False). Configure a PostgreSQL DATABASE_URL.")
            
        self.GEMINI_API_KEY = (self.GEMINI_API_KEY or "").strip()
        self.CORS_ORIGINS = (self.CORS_ORIGINS or "").strip()
        self.REDIS_URL = (self.REDIS_URL or "").strip()
        
        if not self.DEBUG and (not self.CORS_ORIGINS or "*" in [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]):
            raise ValueError("CORS_ORIGINS must be set to an explicit whitelist in production (DEBUG=False). Wildcard '*' is not permitted.")
            
        if not self.DEBUG and self.DEMO_MODE:
            raise ValueError("DEMO_MODE=True is not permitted in production (DEBUG=False).")
            
        return self

    @property
    def cors_origin_list(self) -> list[str]:
        raw = (self.CORS_ORIGINS or os.getenv("FRONTEND_URL", "")).strip()
        if not raw:
            return ["*"]
        return [o.strip().rstrip("/") for o in raw.split(",") if o.strip()]


settings = Settings()
