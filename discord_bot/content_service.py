from __future__ import annotations

from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Dict, List, Optional, Iterable

import uuid as uuidlib
import discord

from db import get_db


@dataclass
class Content:
    uuid: str
    time_utc: datetime
    title: str
    description: str
    created_by: str
    tags: List[str] = field(default_factory=list)
    group_ids: List[str] = field(default_factory=list)  # up to 4 group UUIDs
    location: Optional[str] = None
    # "discord_user_id": "role_index" or "groupIndex.roleIndex" (e.g. "1.2")
    members: Dict[str, str] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    def to_document(self) -> dict:
        return asdict(self)


async def _contents_collection():
    db = get_db()
    # collection name is "contents"
    return db["contents"]


def encode_role_ref(group_position: int, role_index: int, multi_groups: bool) -> str:
    """
    group_position: 1-based index of group inside content.group_ids
    role_index: index of role inside that group (your choice 1-based or 0-based)
    multi_groups: True if content has more than 1 group
    """
    if multi_groups:
        return f"{group_position}.{role_index}"
    return str(role_index)


async def init_content(
    guild: discord.Guild,
    time_utc: datetime,
    title: str,
    description: str,
    created_by: str,
    group_ids: Iterable[str],
    tags: Optional[Iterable[str]] = None,
    location: Optional[str] = None,
) -> Content:
    """
    Create a new content entry inside the guild document in /contents collection.

    - One document per guild: { guild_id, guild_name, contents: [ ... ] }
    - Each content is a subdocument inside contents[].
    """
    col = await _contents_collection()

    group_ids_list = list(group_ids)
    if not group_ids_list:
        raise ValueError("At least one group_id is required for content.")
    if len(group_ids_list) > 4:
        raise ValueError("You can select at most 4 groups for one content.")

    tags_list = list(tags) if tags is not None else []

    content = Content(
        uuid=str(uuidlib.uuid4()),
        time_utc=time_utc,
        title=title,
        description=description,
        tags=tags_list,
        group_ids=group_ids_list,
        location=location,
        created_by=created_by,
    )

    # Upsert the guild document and push this content into contents[]
    await col.update_one(
        {"guild_id": str(guild.id)},
        {
            "$setOnInsert": {
                "guild_id": str(guild.id),
                "created_at": datetime.utcnow(),
            },
            "$set": {
                "guild_name": guild.name,
                "updated_at": datetime.utcnow(),
            },
            "$push": {
                "contents": content.to_document(),
            },
        },
        upsert=True,
    )

    return content


async def add_member_to_content(
    content_uuid: str,
    user_id: int,
    group_position: int,
    role_index: int,
) -> bool:
    """
    Try to assign user to (group_position, role_index).

    Returns True if assignment succeeded, False if the slot is already taken.
    """
    col = await _contents_collection()

    # Find the guild document that contains this content
    guild_doc = await col.find_one({"contents.uuid": content_uuid})
    if not guild_doc:
        raise ValueError(f"Content {content_uuid} not found")

    contents = guild_doc.get("contents", [])
    content_doc = next((c for c in contents if c.get("uuid") == content_uuid), None)
    if not content_doc:
        raise ValueError(f"Content {content_uuid} not found in guild document")

    group_ids = content_doc.get("group_ids", [])
    if not (1 <= group_position <= len(group_ids)):
        raise ValueError("group_position is out of range for this content")

    multi_groups = len(group_ids) > 1
    role_ref = encode_role_ref(group_position, role_index, multi_groups)
    user_key = str(user_id)

    members = content_doc.get("members", {})

    # If this role_ref is already used by someone else, do NOT assign
    if role_ref in members.values():
        return False

    # Otherwise, assign this user to this role
    await col.update_one(
        {"guild_id": guild_doc["guild_id"], "contents.uuid": content_uuid},
        {
            "$set": {
                f"contents.$.members.{user_key}": role_ref,
                "updated_at": datetime.utcnow(),
                "contents.$.updated_at": datetime.utcnow(),
            }
        },
    )

    return True


async def remove_member_from_content(content_uuid: str, user_id: int) -> None:
    col = await _contents_collection()

    guild_doc = await col.find_one({"contents.uuid": content_uuid})
    if not guild_doc:
        return  # nothing to do

    await col.update_one(
        {"guild_id": guild_doc["guild_id"], "contents.uuid": content_uuid},
        {
            "$unset": {f"contents.$.members.{user_id}": ""},
            "$set": {
                "updated_at": datetime.utcnow(),
                "contents.$.updated_at": datetime.utcnow(),
            },
        },
    )


async def get_content_by_uuid(content_uuid: str) -> Optional[Content]:
    col = await _contents_collection()
    guild_doc = await col.find_one({"contents.uuid": content_uuid})
    if not guild_doc:
        return None

    contents = guild_doc.get("contents", [])
    content_doc = next((c for c in contents if c.get("uuid") == content_uuid), None)
    if not content_doc:
        return None

    return Content(
        uuid=content_doc["uuid"],
        time_utc=content_doc["time_utc"],
        title=content_doc["title"],
        description=content_doc["description"],
        created_by=content_doc["created_by"],
        tags=content_doc.get("tags", []),
        group_ids=content_doc.get("group_ids", []),
        location=content_doc.get("location"),
        members=content_doc.get("members", {}),
        created_at=content_doc.get("created_at", datetime.utcnow()),
        updated_at=content_doc.get("updated_at", datetime.utcnow()),
    )
