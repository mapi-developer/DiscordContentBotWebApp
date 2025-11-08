from typing import Optional, Any, Dict, List, Tuple
from datetime import datetime, date, time
import os
import discord
from discord import app_commands
from discord.ext import commands
from dotenv import load_dotenv

from content_service import (
    init_content,
    add_member_to_content,
    get_content_by_uuid,
    Content,
)
from db import get_db

load_dotenv()

TOKEN = os.getenv("DISCORD_BOT_TOKEN")
if TOKEN is None:
    raise RuntimeError("DISCORD_BOT_TOKEN is not set in .env")

# ⚠️ Put your real server ID here (right-click server icon → Copy Server ID)
GUILD_ID = int(os.getenv("DISCORD_GUILD_ID", "0"))  # or hardcode: 123456789012345678
if GUILD_ID == 0:
    raise RuntimeError("Set DISCORD_GUILD_ID in .env or hardcode GUILD_ID")

intents = discord.Intents.default()
intents.message_content = True
intents.members = True
# message_content intent is not needed for slash, but you can enable if you want:
# intents.message_content = True


async def build_content_display(
    content: Content,
    guild: discord.Guild,
) -> Tuple[str, List[discord.Embed], List[Dict[str, Any]]]:
    """
    Builds:
    - plain text header message (title, host, date, time, location)
    - party embeds with roles (and assigned players)
    - metadata for dropdowns: which group has which roles
    """

    db = get_db()
    groups_col = db["groups"]
    roles_col = db["roles"]

    # ----- header -----
    date_str = content.time_utc.strftime("%d.%m.%y")
    time_str = content.time_utc.strftime("%H:%M")
    location_str = content.location or "Not specified"

    host_member = (
        guild.get_member(int(content.created_by)) if content.created_by else None
    )
    if host_member is not None:
        host_text = host_member.mention
    else:
        host_text = f"<@{content.created_by}>" if content.created_by else "Unknown"

    header_text = (
        f"**{content.title}**\n"
        f"hosted by {host_text}\n"
        f"{content.description}\n"
        f"**Date:** {date_str}\n"
        f"**Time (UTC):** **{time_str}**\n"
        f"**Location:** {location_str}"
    )

    # ----- decode assignments from content.members -----
    assignments: Dict[Tuple[int, int], List[int]] = {}
    group_count = len(content.group_ids)

    for user_id_str, ref in content.members.items():
        try:
            user_id = int(user_id_str)
        except ValueError:
            continue

        if "." in ref:
            g_str, r_str = ref.split(".", 1)
            try:
                g = int(g_str)
                r = int(r_str)
            except ValueError:
                continue
        else:
            # legacy "role only" format – assume single group
            try:
                r = int(ref)
            except ValueError:
                continue
            g = 1 if group_count >= 1 else 1

        assignments.setdefault((g, r), []).append(user_id)

    party_embeds: List[discord.Embed] = []
    select_specs: List[Dict[str, Any]] = []

    # ----- build Party embeds + dropdown meta -----
    for idx, group_id in enumerate(content.group_ids, start=1):
        group_doc = await groups_col.find_one({"uuid": group_id})
        if not group_doc:
            embed = discord.Embed(
                title=f"Party {idx}",
                description="Group not found in database.",
                color=discord.Color.blurple(),
            )
            embed.set_footer(text=f"uuid: {group_id}")
            party_embeds.append(embed)
            continue

        # group_doc.get("name") or f"Party {idx}"
        group_name = f"Party {idx}"
        role_uuids = group_doc.get("roles", [])

        role_lines: List[str] = []
        role_meta: List[Dict[str, Any]] = []

        if not role_uuids:
            role_lines.append("_No roles in this group yet._")
        else:
            for role_index, role_uuid in enumerate(role_uuids, start=1):
                role_doc = await roles_col.find_one({"uuid": role_uuid})
                if role_doc and "name" in role_doc:
                    role_name = role_doc["name"]
                else:
                    role_name = f"Role {role_index}"

                role_meta.append({"index": role_index, "name": role_name})

                # check if someone is assigned to this (group, role)
                assigned_ids = assignments.get((idx, role_index), [])
                display_line = f"{role_index}. {role_name}"

                if assigned_ids:
                    member = guild.get_member(assigned_ids[0])
                    print(member)
                    if member:
                        display_line = f"✅ {display_line} - {member.display_name}"
                else:
                    display_line = f"❌ {display_line}"

                role_lines.append(display_line)

        party_embed = discord.Embed(
            title=group_name,
            color=discord.Color.blurple(),
        )

        if role_lines:
            if len(role_lines) <= 10:
                # single column
                col1 = "\n".join(role_lines)
                party_embed.add_field(name="\u200b", value=col1, inline=True)
            else:
                # two columns: 1–10, 11–20
                col1 = "\n".join(role_lines[:10])
                col2 = "\n".join(role_lines[10:])
                party_embed.add_field(name="\u200b", value=col1, inline=True)
                party_embed.add_field(name="\u200b", value=col2, inline=True)
        else:
            party_embed.description = "_No roles in this group yet._"

        party_embed.set_footer(text=f"uuid: {group_id}")
        party_embeds.append(party_embed)

        if role_meta:
            select_specs.append(
                {
                    "group_index": idx,
                    "group_id": group_id,
                    "roles": role_meta,
                }
            )

    return header_text, party_embeds, select_specs


class RoleSelect(discord.ui.Select):
    def __init__(
        self, content_uuid: str, group_index: int, roles: List[Dict[str, Any]]
    ):
        options = [
            discord.SelectOption(
                label=f"{r['index']}. {r['name']}",
                value=f"{group_index}:{r['index']}",  # "group:role"
            )
            for r in roles
        ]

        placeholder = f"Party {group_index}: choose your role"

        super().__init__(
            placeholder=placeholder,
            min_values=1,
            max_values=1,
            options=options,
        )
        self.content_uuid = content_uuid

    async def callback(self, interaction: discord.Interaction):
        value = self.values[0]
        group_str, role_str = value.split(":", 1)
        group_index = int(group_str)
        role_index = int(role_str)

        # Try to assign; returns False if slot already taken
        success = await add_member_to_content(
            content_uuid=self.content_uuid,
            user_id=interaction.user.id,
            group_position=group_index,
            role_index=role_index,
        )

        if not success:
            await interaction.response.send_message(
                "❌ This role was already taken by someone else.",
                ephemeral=True,
                delete_after=3,
            )
            return

        # reload content from DB
        content = await get_content_by_uuid(self.content_uuid)
        if content is None or interaction.guild is None:
            await interaction.response.send_message(
                "Content not found anymore.", ephemeral=True
            )
            return

        # rebuild header and parties (now including this assignment)
        header_text, party_embeds, _ = await build_content_display(
            content, interaction.guild
        )

        # update the original message (still keep same dropdowns)
        await interaction.response.edit_message(
            content=header_text,
            embeds=party_embeds,
            view=self.view,
        )


class RoleSignupView(discord.ui.View):
    def __init__(self, content_uuid: str, select_specs: List[Dict[str, Any]]):
        super().__init__(timeout=None)
        self.content_uuid = content_uuid

        for spec in select_specs:
            roles = spec.get("roles", [])
            if not roles:
                continue

            group_index = spec["group_index"]
            select = RoleSelect(content_uuid, group_index, roles)
            self.add_item(select)


bot = commands.Bot(command_prefix="!", intents=intents)


@bot.event
async def on_ready():
    print(f"Logged in as {bot.user} (ID: {bot.user.id})")

    guild_obj = discord.Object(id=GUILD_ID)

    try:
        # sync ONLY to this guild so it updates instantly
        synced = await bot.tree.sync(guild=guild_obj)
        print(f"Synced {len(synced)} app commands to guild {GUILD_ID}")
    except Exception as e:
        print(f"Failed to sync commands: {e}")


# ---------- TEST COMMAND: /ping ----------


@bot.tree.command(name="ping", description="Simple test command")
@app_commands.guilds(discord.Object(id=GUILD_ID))
async def ping(interaction: discord.Interaction):
    await interaction.response.send_message("Pong! ✅", ephemeral=True, delete_after=3)


# ---------- YOUR REAL COMMAND: /content_create ----------


@bot.tree.command(name="content_create", description="Create new content event")
@app_commands.guilds(discord.Object(id=GUILD_ID))
@app_commands.describe(
    date_utc="Date in UTC, format DD.MM.YY (e.g. 21.09.25)",
    time_utc="Time in UTC, 24h format HH:MM (e.g. 18:00)",
    title="Content title",
    description="Content description",
    group1_id="UUID of the first group (required)",
    group2_id="UUID of the second group (optional)",
    group3_id="UUID of the third group (optional)",
    group4_id="UUID of the fourth group (optional)",
    location="Location (optional, in-game or IRL)",
)
async def content_create(
    interaction: discord.Interaction,
    date_utc: str,
    time_utc: str,
    title: str,
    description: str,
    group1_id: str,
    group2_id: Optional[str] = None,
    group3_id: Optional[str] = None,
    group4_id: Optional[str] = None,
    location: Optional[str] = None,
):
    if interaction.guild is None:
        await interaction.response.send_message(
            "Use this command inside a server.", ephemeral=True
        )
        return

    # --- parse date ---
    try:
        d: date = datetime.strptime(date_utc, "%d.%m.%y").date()
    except ValueError:
        await interaction.response.send_message(
            "❌ Invalid **date** format.\n" "Use `DD.MM.YY`, e.g. `21.09.25`.",
            ephemeral=True,
        )
        return

    # --- parse time ---
    try:
        t: time = datetime.strptime(time_utc, "%H:%M").time()
    except ValueError:
        await interaction.response.send_message(
            "❌ Invalid **time** format.\n" "Use 24h `HH:MM`, e.g. `18:00`.",
            ephemeral=True,
        )
        return

    # --- build group_ids list (1–4 groups) ---
    group_ids: list[str] = [group1_id]
    for g in (group2_id, group3_id, group4_id):
        if g:
            group_ids.append(g)

    if len(group_ids) > 4:
        await interaction.response.send_message(
            "❌ You can select at most **4 groups** for one content.",
            ephemeral=True,
        )
        return

    # Combine date + time into one UTC datetime (naive, assumed UTC)
    time_utc_dt = datetime.combine(d, t)

    # Create content in Mongo
    content = await init_content(
        guild=interaction.guild,
        time_utc=time_utc_dt,
        title=title,
        description=description,
        created_by=str(interaction.user.id),
        group_ids=group_ids,
        tags=[],
        location=location,
    )

    # Build header + party embeds + dropdown meta
    header_text, party_embeds, select_specs = await build_content_display(
        content, interaction.guild
    )

    # view with dropdowns under the message
    view = RoleSignupView(content.uuid, select_specs)

    # public message with header text + party embeds + dropdowns
    await interaction.response.send_message(
        content=header_text,
        embeds=party_embeds,
        view=view,
    )


if __name__ == "__main__":
    # If you're using package imports (from .content_service), run from repo root:
    # python -m discord_bot.main
    bot.run(TOKEN)
