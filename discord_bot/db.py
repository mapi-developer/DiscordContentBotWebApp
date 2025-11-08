import os
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/discord_content_bot")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "discord_content_bot")

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(MONGODB_URI)
    return _client


def get_db() -> AsyncIOMotorDatabase:
    client = get_client()
    return client[MONGODB_DB_NAME]
