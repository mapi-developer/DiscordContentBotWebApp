from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field

from .bson import PyObjectId

# ---------- Input / Update ----------

class GroupIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: Optional[str] = Field(default="", max_length=500)

class GroupUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: Optional[str] = Field(default="", max_length=500)

# ---------- DB model (internal) ----------

class GroupDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    uuid: str = Field(default_factory=lambda: str(uuid4()))
    name:str = Field(min_length=1, max_length=120)
    description: Optional[str] = Field(default="", max_length=500)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        populate_by_name=True,         # allow using "id" to populate "_id"
        arbitrary_types_allowed=True,  # for ObjectId
        json_encoders={PyObjectId: str}
    )


class GroupDBNew(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    uuid: str = Field(default_factory=lambda: str(uuid4()))
    name:str = Field(min_length=1, max_length=120)
    description: Optional[str] = Field(default="", max_length=500)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    group_type: Optional[List[str]]
    group_party: Dict


    model_config = ConfigDict(
        populate_by_name=True,         # allow using "id" to populate "_id"
        arbitrary_types_allowed=True,  # for ObjectId
        json_encoders={PyObjectId: str}
    )

# ---------- Output DTO ----------

class GroupOut(BaseModel):
    id: str
    uuid: str
    name: str = Field(min_length=1, max_length=120)
    description: Optional[str] = Field(default="", max_length=500)
    created_at: datetime

    @classmethod
    def from_db(cls, db: GroupDB) -> "GroupOut":
        return cls(
            id=str(db.id),
            uuid=db.uuid,
            name=db.name,
            description=db.description,
            created_at=db.created_at,
        )
