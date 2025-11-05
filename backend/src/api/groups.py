from __future__ import annotations

from typing import Dict, List, Optional
from uuid import uuid4

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError

from ..db.mongo import get_db
from ..schemas import GroupDB, GroupIn, GroupOut, GroupUpdate, RoleIn

router = APIRouter(prefix="/groups", tags=["groups"])


def _clean(s: Optional[str]) -> Optional[str]:
    if s is None:
        return None
    s = s.strip()
    return s or None


@router.get("", response_model=List[GroupOut])
async def list_groups(db: AsyncIOMotorDatabase = Depends(get_db)):
    cursor = (
        db["groups"]
        .find(
            {},
            projection={
                "_id": 1,
                "uuid": 1,
                "name": 1,
                "description": 1,
                "tags": 1,
                "roles": 1,
                "creator_id": 1,
                "created_at": 1,
            },
        )
        .sort("created_at", -1)
    )

    out: List[GroupOut] = []
    async for doc in cursor:
        db_model = GroupDB.model_validate(doc)
        out.append(GroupOut.from_db(db_model))

    return out


@router.post("", response_model=GroupOut, status_code=status.HTTP_201_CREATED)
async def create_group(
    payload: GroupIn,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    # 1) Create the group first with an empty roles list
    creator_id = (payload.creator_id or "").strip() or "unknown"

    db_model = GroupDB(
        name=payload.name.strip(),
        description=_clean(payload.description),
        tags=payload.tags or [],
        roles=[],
        creator_id=creator_id,
    )

    res = await db["groups"].insert_one(db_model.model_dump(by_alias=True))
    inserted = await db["groups"].find_one({"_id": res.inserted_id})
    if not inserted:
        raise HTTPException(
            status_code=500, detail="Failed to create group document in database"
        )

    group = GroupDB.model_validate(inserted)

    # 2) Process roles: reuse identical roles, version changed ones
    role_uuids: list[str] = []

    for raw_role in payload.roles:
        role = RoleIn.model_validate(raw_role)

        name = role.name.strip()
        if not name:
            # skip completely empty roles just in case
            continue

        normalized_doc = {
            "name": name,
            "description": _clean(role.description),
            "role_type": role.role_type.strip(),
            "items": role.items or {},
        }

        existing = None
        if role.uuid:
            existing = await db["roles"].find_one({"uuid": role.uuid})

        if existing:
            # Compare all relevant fields
            same = (
                existing.get("name") == normalized_doc["name"]
                and existing.get("description") == normalized_doc["description"]
                and existing.get("role_type") == normalized_doc["role_type"]
                and (existing.get("items") or {}) == normalized_doc["items"]
            )

            if same:
                # 2a) Completely identical → reuse existing uuid, no new doc
                role_uuid = existing["uuid"]
            else:
                # 2b) Something changed → create a *new* version with fresh uuid
                role_uuid = str(uuid4())
                await db["roles"].insert_one(
                    {
                        "uuid": role_uuid,
                        **normalized_doc,
                    }
                )
        else:
            # 2c) No existing role with this uuid → treat as new role
            role_uuid = role.uuid or str(uuid4())
            await db["roles"].insert_one(
                {
                    "uuid": role_uuid,
                    **normalized_doc,
                }
            )

        role_uuids.append(role_uuid)

    # 3) Attach role uuids to the group
    if role_uuids:
        await db["groups"].update_one(
            {"_id": group.id},
            {"$set": {"roles": role_uuids}},
        )
        updated = await db["groups"].find_one({"_id": group.id})
        if updated:
            group = GroupDB.model_validate(updated)

    return GroupOut.from_db(group)


@router.get("/{group_id}", response_model=GroupOut)
async def get_group(
    group_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if not ObjectId.is_valid(group_id):
        raise HTTPException(status_code=400, detail="Invalid group id")

    doc = await db["groups"].find_one({"_id": ObjectId(group_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Group not found")

    return GroupOut.from_db(GroupDB.model_validate(doc))


@router.patch("/{group_id}", response_model=GroupOut)
async def update_group(
    group_id: str,
    patch: GroupUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if not ObjectId.is_valid(group_id):
        raise HTTPException(status_code=400, detail="Invalid group id")

    # Build the $set document from whatever fields are present
    update_doc: Dict[str, object] = {}

    if patch.name is not None:
        update_doc["name"] = patch.name.strip()
    if patch.description is not None:
        update_doc["description"] = _clean(patch.description)
    if patch.tags is not None:
        update_doc["tags"] = patch.tags
    if patch.roles is not None:
        update_doc["roles"] = patch.roles
    if patch.creator_id is not None:
        update_doc["creator_id"] = patch.creator_id.strip()

    # Nothing to update → just return current doc (or 404)
    if not update_doc:
        doc = await db["groups"].find_one({"_id": ObjectId(group_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Group not found")
        return GroupOut.from_db(GroupDB.model_validate(doc))

    try:
        await db["groups"].update_one(
            {"_id": ObjectId(group_id)},
            {"$set": update_doc},
        )
    except DuplicateKeyError:
        # only relevant if you add a unique index on name
        raise HTTPException(
            status_code=409,
            detail="Group name already exists",
        )

    doc = await db["groups"].find_one({"_id": ObjectId(group_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Group not found")

    return GroupOut.from_db(GroupDB.model_validate(doc))


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(
    group_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if not ObjectId.is_valid(group_id):
        raise HTTPException(status_code=400, detail="Invalid group id")

    res = await db["groups"].delete_one({"_id": ObjectId(group_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Group not found")

    # NOTE: roles are not deleted here; you can add a cascade delete later if needed.
    return


@router.get("/by-uuid/{uuid}", response_model=GroupOut)
async def get_group_by_uuid(
    uuid: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await db["groups"].find_one({"uuid": uuid})
    if not doc:
        raise HTTPException(status_code=404, detail="Group not found")

    return GroupOut.from_db(GroupDB.model_validate(doc))
