from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError

from ..db.mongo import get_db
from ..schemas import ItemIn, ItemOut

router = APIRouter(prefix="/items", tags=["items"])


def _to_out(doc) -> ItemOut:
    return ItemOut(
        id=str(doc["_id"]),
        item_db_name=doc["item_db_name"],
        item_name=doc["item_name"],
        item_category_main=doc["item_category_main"],
        item_category_second=doc["item_category_second"],
    )


@router.get("/", response_model=List[ItemOut])
async def list_items(db: AsyncIOMotorDatabase = Depends(get_db)):
    cursor = db.items.find({})
    results: list[ItemOut] = []
    async for doc in cursor:
        results.append(_to_out(doc))
    return results


@router.post("/seed", response_model=int, status_code=status.HTTP_201_CREATED)
async def seed_items(
    items: List[ItemIn],
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    inserted_count = 0

    for it in items:
        try:
            await db.items.insert_one(
                {
                    "item_db_name": it.item_db_name,
                    "item_name": it.item_name,
                    "item_category_main": it.item_category_main,
                    "item_category_second": it.item_category_second,
                }
            )
            inserted_count += 1
        except DuplicateKeyError:
            continue

    return inserted_count
