from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import RedirectResponse

from ...core.security import create_jwt, verify_jwt
from ...core.settings import settings
from ...db.mongo import get_db

router = APIRouter(prefix="/auth/discord", tags=["auth"])

DISCORD_AUTHORIZE = "https://discord.com/api/oauth2/authorize"
DISCORD_TOKEN = "https://discord.com/api/oauth2/token"
DISCORD_ME = "https://discord.com/api/users/@me"


@router.get("/login")
async def login(next: str | None = None):
    """
    Kick off OAuth. Optional `next` query will be echoed through the flow.
    """
    params = (
        f"client_id={settings.DISCORD_CLIENT_ID}"
        f"&redirect_uri={settings.DISCORD_REDIRECT_URI}"
        f"&response_type=code"
        f"&scope=identify%20email"
        f"&prompt=consent"
    )
    if next:
        # Attach state to carry `next` safely (basic approach).
        params += f"&state={httpx.QueryParams({'next': next})}"
    return RedirectResponse(f"{DISCORD_AUTHORIZE}?{params}")


@router.get("/callback")
async def callback(
    code: str,
    response: Response,
    request: Request,
    state: str | None = None,
    db=Depends(get_db),
):
    # 1) Exchange code for tokens
    data = {
        "client_id": settings.DISCORD_CLIENT_ID,
        "client_secret": settings.DISCORD_CLIENT_SECRET,
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": settings.DISCORD_REDIRECT_URI,
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}

    async with httpx.AsyncClient(timeout=20.0) as client:
        token_res = await client.post(DISCORD_TOKEN, data=data, headers=headers)
        if token_res.status_code != 200:
            return RedirectResponse(settings.FRONTEND_ERROR_URL)
        tokens = token_res.json()
        access_token = tokens["access_token"]

        # 2) Get user profile
        me_res = await client.get(
            DISCORD_ME, headers={"Authorization": f"Bearer {access_token}"}
        )
        if me_res.status_code != 200:
            return RedirectResponse(settings.FRONTEND_ERROR_URL)
        profile = me_res.json()

    # 3) Upsert user
    now = datetime.now(timezone.utc)
    users = db["users"]
    discord_id = profile["id"]
    update = {
        "$set": {
            "discord.id": discord_id,
            "discord.username": profile.get("username"),
            "discord.global_name": profile.get("global_name"),
            "discord.email": profile.get("email"),
            "discord.avatar": profile.get("avatar"),
            "updated_at": now,
        },
        "$setOnInsert": {"created_at": now},
    }
    await users.update_one({"discord.id": discord_id}, update, upsert=True)

    # 4) Issue session cookie
    jwt_token = create_jwt(sub=str(discord_id))
    # allow setting cookie on localhost http; for prod keep secure=True
    response = RedirectResponse(
        settings.FRONTEND_SUCCESS_URL + (f"?{state}" if state else "")
    )
    response.set_cookie(
        key="session",
        value=jwt_token,
        httponly=True,
        secure=False,  # set True in production over HTTPS
        samesite="lax",
        max_age=60 * 60 * 24 * settings.JWT_EXPIRE_DAYS,
        path="/",
    )
    return response


@router.post("/logout")
async def logout():
    resp = RedirectResponse(settings.FRONTEND_SUCCESS_URL)
    resp.delete_cookie("session", path="/")
    return resp


@router.get("/me")
async def me(request: Request, db=Depends(get_db)):
    cookie = request.cookies.get("session")
    if not cookie:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = verify_jwt(cookie)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    discord_id = payload["sub"]
    user = await db["users"].find_one({"discord.id": discord_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user": user}
