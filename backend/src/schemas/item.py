from __future__ import annotations

from bson import ObjectId
from pydantic import BaseModel, Field


class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        try:
            return ObjectId(str(v))
        except Exception as e:
            raise ValueError("Not a valid ObjectId") from e


class ItemIn(BaseModel):
    item_db_name: str = Field(
        ..., description="Stable technical name / ID we use in code (unique)."
    )
    item_name: str = Field(..., description="Human readable name to show in UI.")
    item_category_main: str = Field(
        ..., description="Top-level category, e.g. 'Weapons'"
    )
    item_category_second: str = Field(..., description="Sub-category, e.g. 'Swords'")


class ItemDB(ItemIn):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class ItemOut(BaseModel):
    id: str
    item_db_name: str
    item_name: str
    item_category_main: str
    item_category_second: str
