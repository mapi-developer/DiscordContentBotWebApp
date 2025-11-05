from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field

from .bson import PyObjectId
from .role import RoleIn


class GroupIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: Optional[str] = Field(default="", max_length=500)

    # simple tags for filtering/searching
    tags: List[str] = Field(default_factory=list)

    # full role configs, will be converted to role UUIDs in DB
    roles: List[RoleIn] = Field(default_factory=list)

    # Discord user id of the creator
    creator_id: Optional[str] = Field(
        default=None,
        max_length=64,
        description="Discord user id of the user who created this group.",
    )


class GroupUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=120)
    description: Optional[str] = Field(default=None, max_length=500)
    tags: Optional[List[str]] = None

    # for now we only support replacing the list of role UUIDs via PATCH
    roles: Optional[List[str]] = None

    creator_id: Optional[str] = Field(default=None, max_length=64)


class GroupDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    uuid: str = Field(default_factory=lambda: str(uuid4()))
    name: str = Field(min_length=1, max_length=120)
    description: Optional[str] = Field(default="", max_length=500)
    tags: List[str] = Field(default_factory=list)
    roles: List[str] = Field(
        default_factory=list,
        description="List of role UUIDs that belong to this group.",
    )

    creator_id: Optional[str] = Field(default=None, max_length=64)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={PyObjectId: str},
    )


class GroupOut(BaseModel):
    id: str
    uuid: str
    name: str
    description: Optional[str]
    tags: List[str]
    roles: List[str]
    creator_id: Optional[str]
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
