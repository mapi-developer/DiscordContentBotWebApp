# test
from __future__ import annotations

from typing import Dict, List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError

from ..db.mongo import get_db
from ..schemas import GroupDB, GroupIn, GroupOut, GroupUpdate

router = APIRouter(prefix="/groups", tags=["auth"])


def _clean(s: Optional[str]) -> Optional[str]:
    if s is None:
        return None
    s = s.strip()
    return s or None


@router.get("", response_model=List[GroupOut])
async def list_groups(db: AsyncIOMotorDatabase = Depends(get_db)):
    cursor = (
        db["groups"]
        .find({}, projection={"_id": 1, "name": 1, "description": 1, "created_at": 1})
        .sort("created_at", -1)
    )
    out: list[GroupOut] = []
    async for doc in cursor:
        db_model = GroupDB.model_validate(doc)  # parse raw Mongo doc
        out.append(GroupOut.from_db(db_model))
    return out


@router.post("", response_model=GroupOut, status_code=status.HTTP_201_CREATED)
async def create_group(payload: GroupIn, db: AsyncIOMotorDatabase = Depends(get_db)):
    db_model = GroupDB(
        name=payload.name.strip(),
        description=(payload.description.strip() if payload.description else None),
    )
    res = await db["groups"].insert_one(db_model.model_dump(by_alias=True))
    inserted = await db["groups"].find_one({"_id": res.inserted_id})
    return GroupOut.from_db(GroupDB.model_validate(inserted))


@router.get("/{group_id}", response_model=GroupOut)
async def get_group(group_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    if not ObjectId.is_valid(group_id):
        raise HTTPException(status_code=400, detail="Invalid group id")
    doc = await db["groups"].find_one({"_id": ObjectId(group_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Group not found")
    return GroupOut.from_db(GroupDB.model_validate(doc))


@router.patch("/{group_id}", response_model=GroupOut)
async def update_group(
    group_id: str, patch: GroupUpdate, db: AsyncIOMotorDatabase = Depends(get_db)
):
    if not ObjectId.is_valid(group_id):
        raise HTTPException(status_code=400, detail="Invalid group id")

    # 👇 Explicitly allow Optional[str] values in the dict
    update_doc: Dict[str, Optional[str]] = {}

    if patch.name is not None:
        update_doc["name"] = patch.name.strip()
    if patch.description is not None:
        update_doc["description"] = _clean(patch.description)

    if not update_doc:
        doc = await db["groups"].find_one({"_id": ObjectId(group_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Group not found")
        return GroupOut.from_db(GroupDB.model_validate(doc))

    try:
        await db["groups"].update_one({"_id": ObjectId(group_id)}, {"$set": update_doc})
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="Group name already exists")

    doc = await db["groups"].find_one({"_id": ObjectId(group_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Group not found")
    return GroupOut.from_db(GroupDB.model_validate(doc))


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(group_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    if not ObjectId.is_valid(group_id):
        raise HTTPException(status_code=400, detail="Invalid group id")
    res = await db["groups"].delete_one({"_id": ObjectId(group_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Group not found")
    return


@router.get("/by-uuid/{uuid}", response_model=GroupOut)
async def get_group_by_uuid(uuid: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    doc = await db["groups"].find_one({"uuid": uuid})
    if not doc:
        raise HTTPException(status_code=404, detail="Group not found")
    return GroupOut.from_db(GroupDB.model_validate(doc))
