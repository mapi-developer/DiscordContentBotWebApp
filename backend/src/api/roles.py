from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from src.schemas.role import RoleDB, RoleOut

from ..db.mongo import get_db

router = APIRouter(prefix="/roles", tags=["roles"])


@router.get("", response_model=list[RoleOut])
async def list_roles(
    uuids: str | None = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    query: dict[str, Any] = {}
    if uuids:
        uuid_list = [u.strip() for u in uuids.split(",") if u.strip()]
        query["uuid"] = {"$in": uuid_list}

    cursor = db["roles"].find(query)
    out: list[RoleOut] = []
    async for doc in cursor:
        db_model = RoleDB.model_validate(doc)
        out.append(RoleOut.from_db(db_model))
    return out
