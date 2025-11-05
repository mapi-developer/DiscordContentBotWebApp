from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field

from .bson import PyObjectId
from .role import RoleIn

# ---------- Input / Update ----------


class GroupIn(BaseModel):
    """
    Payload for creating a group.

    Matches the TS GroupCreatePayload shape from frontend/src/types/group.ts
    (except for id / uuid / created_at which are generated here).
    """

    name: str = Field(min_length=1, max_length=120)
    description: Optional[str] = Field(default="", max_length=500)
    tags: Optional[List[str]] = None
    roles: List[RoleIn] = Field(
        default_factory=list,
        description="Full role definitions; on the DB we only store their uuids.",
    )
    # Optional for now – if not provided we fill in a placeholder.
    creator_id: Optional[str] = Field(default=None, min_length=1, max_length=120)


class GroupUpdate(BaseModel):
    """
    Partial update; every field is optional.
    """

    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    description: Optional[str] = Field(default=None, max_length=500)
    tags: Optional[List[str]] = None
    # When updating we only allow replacing the list of role uuids on the group.
    roles: Optional[List[str]] = None
    creator_id: Optional[str] = Field(default=None, min_length=1, max_length=120)


# ---------- DB model (internal) ----------


class GroupDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    uuid: str = Field(default_factory=lambda: str(uuid4()))
    name: str = Field(min_length=1, max_length=120)
    description: Optional[str] = Field(default="", max_length=500)
    tags: Optional[List[str]] = None
    roles: List[str] = Field(
        default_factory=list,
        description="List of role uuids that belong to this group.",
    )
    creator_id: str = Field(min_length=1, max_length=120)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,  # allow using "id" to populate "_id"
        arbitrary_types_allowed=True,  # for ObjectId
        json_encoders={PyObjectId: str},
    )


# ---------- Output DTO ----------


class GroupOut(BaseModel):
    id: str
    uuid: str
    name: str = Field(min_length=1, max_length=120)
    description: Optional[str] = Field(default="", max_length=500)
    tags: Optional[List[str]]
    roles: List[str] = Field(default_factory=list)
    creator_id: str
    created_at: datetime

    @classmethod
    def from_db(cls, db: GroupDB) -> "GroupOut":
        return cls(
            id=str(db.id),
            uuid=db.uuid,
            name=db.name,
            description=db.description,
            tags=db.tags,
            roles=db.roles,
            creator_id=db.creator_id,
            created_at=db.created_at,
        )
