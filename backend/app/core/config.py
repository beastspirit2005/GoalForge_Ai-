import os
from pydantic_settings import BaseSettings


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

    # Base Application Config
    APP_NAME: str = "GoalForge AI"
    DEBUG: bool = True

    class Config:
        env_file = (".env", "../.env")
        extra = "ignore"


settings = Settings()
