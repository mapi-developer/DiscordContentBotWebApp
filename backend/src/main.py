import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from .api.auth.discord import router as discord_router
from .api.groups import router as groups_router
from .core.settings import settings
from .db.mongo import get_db

SESSION_COOKIE_NAME = os.getenv("SESSION_COOKIE_NAME", "session")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

app = FastAPI(title="DiscordContentBotWebApp API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SESSION_SECRET.get_secret_value(),
    session_cookie=settings.SESSION_COOKIE_NAME,
    domain=settings.SESSION_COOKIE_DOMAIN,         # None in dev
    https_only=settings.SESSION_COOKIE_SECURE,     # True in prod over HTTPS
    same_site=settings.SESSION_COOKIE_SAMESITE,    # "lax" is a good default
)


@app.get("/health")
async def health():
    return {"ok": True}


app.include_router(discord_router)
app.include_router(groups_router)


@app.on_event("startup")
async def init_indexes():
    db = get_db()
    await db["users"].create_index("discord.id", unique=True)
    await db["groups"].create_index("id", unique=True)
