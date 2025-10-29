# backend/settings.py
from typing import Literal, Optional

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Tell Pydantic how to read env / .env and to ignore extras
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
        env_ignore_empty=True,
    )

    # --- Discord ---
    DISCORD_CLIENT_ID: Optional[str] = None
    DISCORD_CLIENT_SECRET: Optional[str] = None
    DISCORD_REDIRECT_URI: Optional[str] = None

    # --- Mongo ---
    MONGODB_URI: Optional[str] = None
    MONGODB_DB: str = "discord_content_bot"

    # --- JWT ---
    JWT_SECRET: Optional[str] = None
    JWT_ALG: str = "HS256"
    JWT_EXPIRE_DAYS: int = 7

    # --- CORS / Frontend ---
    FRONTEND_ORIGIN: str = "http://localhost:3000"
    FRONTEND_SUCCESS_URL: str = "http://localhost:3000/auth/success"
    FRONTEND_ERROR_URL: str = "http://localhost:3000/auth/error"

    # --- Sessions (add these) ---
    SESSION_SECRET: SecretStr  # required
    SESSION_COOKIE_NAME: str = "session"
    SESSION_COOKIE_DOMAIN: Optional[str] = None  # e.g. ".yourdomain.com" in prod (optional)
    SESSION_COOKIE_SECURE: bool = False          # True in prod (HTTPS)
    SESSION_COOKIE_SAMESITE: Literal["lax", "strict", "none"] = "lax"

settings = Settings()
