from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.auth.discord import router as discord_router
from .core.settings import settings
from .db.mongo import get_db

app = FastAPI(title="DiscordContentBotWebApp API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"ok": True}


app.include_router(discord_router)


@app.on_event("startup")
async def init_indexes():
    db = get_db()
    await db["users"].create_index("discord.id", unique=True)
