# discord_bot/main.py
import os
from datetime import datetime, date, time
from typing import Optional

import discord
from discord import app_commands
from discord.ext import commands
from dotenv import load_dotenv

# If you're using package-style imports:
# from .content_service import init_content
# If you're running as a simple script, use:
from content_service import init_content
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
# message_content intent is not needed for slash, but you can enable if you want:
# intents.message_content = True

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
    await interaction.response.send_message("Pong! ✅", ephemeral=True)


# ---------- YOUR REAL COMMAND: /content_create ----------


@bot.tree.command(name="content_create", description="Create new content event")
@app_commands.guilds(discord.Object(id=GUILD_ID))
@app_commands.describe(
    date_utc="Date in UTC, format DD.MM.YY (e.g. 10.09.25)",
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
            "❌ Invalid **date** format.\n" "Use `DD.MM.YY`, e.g. `10.09.25`.",
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

    # Format time for display: "10.09.25 18:00"
    time_str = content.time_utc.strftime("%d.%m.%y %H:%M")
    location_str = content.location or "Not specified"

    # --- build groups + roles section from Mongo ---
    db = get_db()
    groups_col = db["groups"]

    group_blocks: list[str] = []

    for idx, group_id in enumerate(content.group_ids, start=1):
        # Adjust filter if your schema uses ObjectId instead of string
        group_doc = await groups_col.find_one({"uuid": group_id})
        if not group_doc:
            group_blocks.append(f"**Group {idx}:** (not found in DB)")
            continue

        group_name = group_doc.get("name", f"Group {idx}")
        roles = group_doc.get("roles", [])

        lines: list[str] = [f"**Group {idx}: {group_name}**"]

        # roles is expected to be a list of dicts with 'name'
        for role_index, role in enumerate(roles, start=1):
            if isinstance(role, dict):
                role_name = role.get("name", f"Role {role_index}")
            else:
                # fallback if role is just a string
                role_name = str(role)

            lines.append(f"{role_index}. {role_name}")

        group_blocks.append("\n".join(lines))

    groups_section = (
        "\n\n".join(group_blocks) if group_blocks else "No groups attached."
    )

    # 1) Ephemeral confirmation for creator
    await interaction.response.send_message(
        f"✅ Content created:\n"
        f"**Title:** {content.title}\n"
        f"**UUID:** `{content.uuid}`\n"
        f"**Time (UTC):** {time_str}\n"
        f"**Groups:** {', '.join(content.group_ids)}",
        ephemeral=True,
    )

    # 2) Public ping message with groups & roles
    announcement = (
        f"📢 **New content created!**\n"
        f"Created by: {interaction.user.mention}\n"
        f"**Title:** {content.title}\n"
        f"**Description:** {content.description}\n"
        f"**Time (UTC):** {time_str}\n"
        f"**Location:** {location_str}\n\n"
        f"{groups_section}"
    )

    await interaction.followup.send(announcement)


if __name__ == "__main__":
    # If you're using package imports (from .content_service), run from repo root:
    # python -m discord_bot.main
    bot.run(TOKEN)
