from __future__ import annotations

from datetime import datetime
from typing import Dict, Optional
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field

from .bson import PyObjectId


class RoleIn(BaseModel):
    """
    Payload used when creating / attaching a role to a group.

    We only store item_db_name strings for slots on the backend.
    """

    uuid: Optional[str] = Field(
        default=None,
        description="If present, we try to reuse / version an existing role with this uuid.",
    )
    name: str = Field(min_length=1, max_length=120)
    description: Optional[str] = Field(default="", max_length=500)
    role_type: str = Field(min_length=1, max_length=80)
    items: Dict[str, Optional[str]] = Field(
        default_factory=dict,
        description="Map of slot_id -> item_db_name (or null if empty).",
    )


class RoleDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    uuid: str = Field(default_factory=lambda: str(uuid4()))
    name: str = Field(min_length=1, max_length=120)
    description: Optional[str] = Field(default="", max_length=500)
    role_type: str = Field(min_length=1, max_length=80)
    items: Dict[str, Optional[str]] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={PyObjectId: str},
    )


class RoleOut(BaseModel):
    id: str
    uuid: str
    name: str
    description: Optional[str]
    role_type: str
    items: Dict[str, Optional[str]]
    created_at: datetime

    @classmethod
    def from_db(cls, db: RoleDB) -> "RoleOut":
        return cls(
            id=str(db.id),
            uuid=db.uuid,
            name=db.name,
            description=db.description,
            role_type=db.role_type,
            items=db.items,
            created_at=db.created_at,
        )
