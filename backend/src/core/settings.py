from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

    # Discord
    DISCORD_CLIENT_ID: Optional[str] = None
    DISCORD_CLIENT_SECRET: Optional[str] = None
    DISCORD_REDIRECT_URI: Optional[str] = None

    # Mongo
    MONGODB_URI: Optional[str] = None
    MONGODB_DB: str = "discord_content_bot"

    # JWT
    JWT_SECRET: Optional[str] = None
    JWT_ALG: str = "HS256"
    JWT_EXPIRE_DAYS: int = 7

    # CORS / Frontend
    FRONTEND_ORIGIN: str = "http://localhost:3000"
    FRONTEND_SUCCESS_URL: str = "http://localhost:3000/auth/success"
    FRONTEND_ERROR_URL: str = "http://localhost:3000/auth/error"


# instantiate without passing a dict so pydantic reads os.environ / .env automatically
settings = Settings()
