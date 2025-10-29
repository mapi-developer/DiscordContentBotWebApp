from datetime import datetime
from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field
from pymongo.errors import DuplicateKeyError

from ..db.mongo import get_db  # <- your existing helper

router = APIRouter()

# ---------- Pydantic models ----------

class GroupIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: Optional[str] = Field(default=None, max_length=500)

class GroupOut(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    created_at: datetime

# ---------- helpers ----------

def _to_out(doc: dict) -> GroupOut:
    return GroupOut(
        id=str(doc["_id"]),
        name=doc["name"],
        description=doc.get("description"),
        created_at=doc["created_at"],
    )

def _clean(desc: Optional[str]) -> Optional[str]:
    if desc is None:
        return None
    val = desc.strip()
    return val or None

# ---------- endpoints ----------

@router.get("/groups", response_model=List[GroupOut])
async def list_groups(db: AsyncIOMotorDatabase = Depends(get_db)):
    cursor = (
        db["groups"]
        .find({}, projection={"name": 1, "description": 1, "created_at": 1})
        .sort("created_at", -1)
    )
    return [_to_out(doc) async for doc in cursor]

@router.post("/groups", response_model=GroupOut, status_code=status.HTTP_201_CREATED)
async def create_group(payload: GroupIn, db: AsyncIOMotorDatabase = Depends(get_db)):
    doc = {
        "name": payload.name.strip(),
        "description": _clean(payload.description),
        "created_at": datetime.utcnow(),
    }
    try:
        res = await db["groups"].insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="Group name already exists")
    doc["_id"] = res.inserted_id
    return _to_out(doc)

@router.get("/groups/{group_id}", response_model=GroupOut)
async def get_group(group_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        _id = ObjectId(group_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid group id")

    doc = await db["groups"].find_one({"_id": _id})
    if not doc:
        raise HTTPException(status_code=404, detail="Group not found")
    return _to_out(doc)

@router.delete("/groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(group_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    try:
        _id = ObjectId(group_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid group id")

    result = await db["groups"].delete_one({"_id": _id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Group not found")
    return
