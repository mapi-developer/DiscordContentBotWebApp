from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field

from .bson import PyObjectId

# ---------- Input / Update ----------


class GroupIn(BaseModel):
    """
    Payload for creating a group.

    Matches the TS Group shape from frontend/src/types/group.ts
    (except for id / uuid / created_at which are generated here).
    """

    name: str = Field(min_length=1, max_length=120)
    description: Optional[str] = Field(default="", max_length=500)
    role_type: Optional[str] = Field(default=None, max_length=80)
    items: Dict[str, str] = Field(
        default_factory=dict,
        description="Map of slot_id -> item identifier (e.g. item_db_name)",
    )
    tags: Optional[List[str]]
    creator_id: str = Field(min_length=1, max_length=120)


class GroupUpdate(BaseModel):
    """
    Partial update; every field is optional.
    """

    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    description: Optional[str] = Field(default=None, max_length=500)
    role_type: Optional[str] = Field(default=None, max_length=80)
    items: Optional[Dict[str, str]] = None
    tags: Optional[List] = Field(default=None, min_length=1, max_length=120)
    creator_id: Optional[str] = Field(default=None, min_length=1, max_length=120)


# ---------- DB model (internal) ----------


class GroupDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    uuid: str = Field(default_factory=lambda: str(uuid4()))

    name: str = Field(min_length=1, max_length=120)
    description: Optional[str] = Field(default="", max_length=500)
    role_type: Optional[str] = Field(default=None, max_length=80)
    items: Dict[str, str] = Field(default_factory=dict)
    tags: Optional[List] = Field(default=None, max_length=120)
    creator_id: str = Field(min_length=1, max_length=120)

    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,  # allow using "id" to populate "_id"
        arbitrary_types_allowed=True,  # for ObjectId
        json_encoders={PyObjectId: str},
    )


# (If you still have GroupDBNew from earlier experiments you can safely delete it or just ignore it.)


# ---------- Output DTO ----------


class GroupOut(BaseModel):
    id: str
    uuid: str

    name: str = Field(min_length=1, max_length=120)
    description: Optional[str] = Field(default="", max_length=500)
    role_type: Optional[str] = Field(default=None, max_length=80)
    items: Dict[str, str]
    tags: Optional[List]
    creator_id: str

    created_at: datetime

    @classmethod
    def from_db(cls, db: GroupDB) -> "GroupOut":
        return cls(
            id=str(db.id),
            uuid=db.uuid,
            name=db.name,
            description=db.description,
            role_type=db.role_type,
            items=db.items,
            tags=db.tags,
            creator_id=db.creator_id,
            created_at=db.created_at,
        )
