from __future__ import annotations

from typing import Any, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from src.schemas.role import RoleDB, RoleOut

from ..db.mongo import get_db

router = APIRouter(prefix="/roles", tags=["roles"])


def _maybe_object_id(s: str) -> Optional[ObjectId]:
    return ObjectId(s) if ObjectId.is_valid(s) else None


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


@router.get("/{uuid}", response_model=RoleOut)
async def get_role_by_uuid(
    uuid: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    # Find a single role document by its UUID field
    doc = await db["roles"].find_one({"uuid": uuid})
    if not doc:
        raise HTTPException(status_code=404, detail="Role not found")

    db_model = RoleDB.model_validate(doc)
    return RoleOut.from_db(db_model)
