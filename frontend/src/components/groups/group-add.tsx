"use client";

import React, { useState } from "react";

import RoleAddModal, {
    RoleConfig,
} from "@/src/components/groups/role-add";
import { createGroup } from "@/src/lib/api";
import type {
    GroupCreatePayload,
    RoleInputPayload,
} from "@/src/types/group";

const MAX_ROLES = 20;
const SPECIAL_TYPES = ["MEAL", "POTION", "MOUNT"] as const;

const base = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

function getItemIcon(role: RoleConfig | null): string | null {
    if (!role) return null;

    let item = role.slotItems.weapon;

    if (role.roleType === "Battle Mount") {
        item = role.slotItems.mount;
    }

    if (!item) return null;

    const isSpecial = SPECIAL_TYPES.some((el) =>
        item.item_db_name.includes(el),
    );
    return isSpecial
        ? `https://render.albiononline.com/v1/item/${item.item_db_name}`
        : `https://render.albiononline.com/v1/item/T8_${item.item_db_name}`;
}

function getRoleColor(role: RoleConfig | null): string {
    if (!role) return "";

    if (role.roleType === "Tank") {
        return "bg-[#033c82]";
    }
    else if (role.roleType === "Healer") {
        return "bg-[#0b8717]";
    }
    else if (role.roleType === "Support") {
        return "bg-[#a69603]";
    }
    else if (role.roleType === "Range DD") {
        return "bg-[#c27408]";
    }
    else if (role.roleType === "Melee DD") {
        return "bg-[#ad1d07]";
    }
    else if (role.roleType === "Battle Mount") {
        return "bg-[#6b6b6a]";
    }
    else {
        return "bg-[#666666]";
    }
}

export default function GroupAdd() {
    const [open, setOpen] = useState(false);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");

    const [roles, setRoles] = useState<RoleConfig[]>([]);
    const [roleModalOpen, setRoleModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const [saving, setSaving] = useState(false);

    const canSave =
        name.trim().length > 0 && roles.length > 0 && !saving;

    function resetGroup() {
        setName("");
        setDescription("");
        setTags([]);
        setRoles([]);
        setTagInput("");
        setEditingIndex(null);
    }

    function handleTagKeyDown(e: React.KeyboardEvent) {
        // Trigger on Space instead of Enter
        if (e.key !== " " && e.key !== "Spacebar") return; // Spacebar for older browsers
        e.preventDefault(); // don't actually insert a space into the input

        const value = tagInput.trim();
        if (!value) return;
        if (!tags.includes(value)) {
            setTags((prev) => [...prev, value]);
        }
        setTagInput("");
    }

    function removeTag(tag: string) {
        setTags((prev) => prev.filter((t) => t !== tag));
    }

    function openAddRole() {
        if (roles.length >= MAX_ROLES) return;
        setEditingIndex(null);
        setRoleModalOpen(true);
    }

    function openEditRole(idx: number) {
        setEditingIndex(idx);
        setRoleModalOpen(true);
    }

    function handleRoleSave(role: RoleConfig) {
        if (editingIndex === null) {
            // add new
            setRoles((prev) => [...prev, role]);
        } else {
            // update existing
            setRoles((prev) =>
                prev.map((r, i) => (i === editingIndex ? role : r)),
            );
        }
        setRoleModalOpen(false);
        setEditingIndex(null);
    }

    function deleteRole(idx: number) {
        setRoles((prev) => prev.filter((_, i) => i !== idx));
    }

    async function handleSaveGroup() {
        if (!canSave) return;
        setSaving(true);

        try {
            const rolesPayload: RoleInputPayload[] = roles.map((role) => {
                const items: RoleInputPayload["items"] = {
                    bag: role.slotItems.bag
                        ? role.slotItems.bag.item_db_name
                        : null,
                    cape: role.slotItems.cape
                        ? role.slotItems.cape.item_db_name
                        : null,
                    head: role.slotItems.head
                        ? role.slotItems.head.item_db_name
                        : null,
                    armor: role.slotItems.armor
                        ? role.slotItems.armor.item_db_name
                        : null,
                    shoes: role.slotItems.shoes
                        ? role.slotItems.shoes.item_db_name
                        : null,
                    weapon: role.slotItems.weapon
                        ? role.slotItems.weapon.item_db_name
                        : null,
                    off_hand: role.slotItems.off_hand
                        ? role.slotItems.off_hand.item_db_name
                        : null,
                    potion: role.slotItems.potion
                        ? role.slotItems.potion.item_db_name
                        : null,
                    food: role.slotItems.food
                        ? role.slotItems.food.item_db_name
                        : null,
                    mount: role.slotItems.mount
                        ? role.slotItems.mount.item_db_name
                        : null,
                };

                return {
                    uuid: role.uuid,
                    name: role.name.trim(),
                    description: role.description.trim() || undefined,
                    role_type: role.roleType.trim(),
                    items,
                };
            });

            const payload: GroupCreatePayload = {
                name: name.trim(),
                description: description.trim() || undefined,
                tags,
                roles: rolesPayload,
            };

            await createGroup(payload);

            // Notify groups-list to refresh
            new BroadcastChannel("groups").postMessage("refresh");
            setOpen(false);
            resetGroup();
        } catch (err: any) {
            alert(err?.message ?? "Failed to create group");
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            {/* Trigger button */}
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="rounded-lg px-3 py-2 text-sm font-semibold bg-[#19244d] hover:bg-[#1a2b69] text-white transition"
            >
                Add Group
            </button>

            {/* Modal */}
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="relative w-full max-w-5xl rounded-2xl bg-[#050816] p-6 text-white shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                            <div>
                                <h2 className="text-xl font-semibold">Create Group</h2>
                                <p className="text-xs text-white/60">
                                    Configure a group, add tags and roles.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setOpen(false);
                                    resetGroup();
                                }}
                                className="rounded-lg bg-white/10 px-3 py-1 text-sm hover:bg-white/20"
                            >
                                Close
                            </button>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-[2fr_3fr]">
                            {/* LEFT: group fields + tags */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div>
                                        <div className="mt-2 mb-1.5 text-m font-medium text-white/90">
                                            Group Name <span className="text-red-400">*</span>
                                        </div>
                                        <input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="mt-1 w-full rounded-lg border border-white/25 bg-black/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
                                            placeholder="What is the group name?"
                                        />
                                    </div>

                                    <div>
                                        <div className="mt-2 mb-1.5 text-m font-medium text-white/90">
                                            Description
                                        </div>
                                        <textarea
                                            value={description}
                                            onChange={(e) =>
                                                setDescription(e.target.value)
                                            }
                                            rows={4}
                                            className="mt-1 w-full resize-none rounded-lg border border-white/25 bg-black/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
                                            placeholder="Short description of this group."
                                        />
                                    </div>
                                </div>

                                {/* Tags */}
                                <div className="space-y-2 rounded-xl border border-white/15 bg-black/40 p-3">
                                    <div className="flex items-end justify-between mt-2 mb-1.5 text-m font-medium text-white/90">
                                        <span>Group Tags</span>
                                        <span className="text-[10px] text-s">
                                            Works like #mentions (pvp, pve, etc.)
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap max-h-32 gap-2 overflow-y-auto">
                                        {tags.map((tag) => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => removeTag(tag)}
                                                className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[11px] text-white/90"
                                            >
                                                <span>#{tag}</span>
                                                <span className="text-white/60">×</span>
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleTagKeyDown}
                                        className="mt-1 w-full rounded-lg border border-white/25 bg-black/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
                                        placeholder="Type a tag and press Space..."
                                    />
                                </div>
                            </div>

                            {/* RIGHT: Roles list */}
                            <div className="flex h-[480px] flex-col rounded-xl border border-white/15 bg-black/40 p-3">
                                <div className="mb-2 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-semibold uppercase text-white">
                                            Group Roles
                                        </div>
                                        <div className="text-[11px] text-white/50">
                                            {roles.length}/{MAX_ROLES} roles in this group
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={roles.length >= MAX_ROLES}
                                        onClick={openAddRole}
                                        className={[
                                            "px-3 py-1 text-sm",
                                            roles.length >= MAX_ROLES
                                                ? " bg-white/10 cursor-not-allowed text-white/40"
                                                : " bg-blue-600 hover:bg-blue-700",
                                        ].join(" rounded-md px-4 py-1.5 font-bold text-white transition border border-white/30")}
                                    >
                                        Add Role
                                    </button>
                                </div>

                                <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-white/10 bg-black/60 p-2">
                                    {!roles.length && (
                                        <div className="py-10 text-center text-sm text-white/60">
                                            No roles yet. Use{" "}
                                            <span className="font-semibold">Add Role</span> to
                                            configure the first one.
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        {roles.map((role, idx) => {
                                            const weaponItem = role.slotItems.weapon;
                                            const img_src = getItemIcon(role);
                                            const role_bg_color = getRoleColor(role)

                                            return (
                                                <div
                                                    key={idx}
                                                    className="flex items-center gap-3 rounded-xl border border-white/20 bg-[#101321] px-3 py-2"
                                                >
                                                    {/* Icon */}
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-black/50">
                                                        {img_src ? (
                                                            <img
                                                                src={img_src}
                                                                alt={weaponItem?.item_name ?? "weapon"}
                                                                className="h-full w-full object-contain"
                                                            />
                                                        ) : (
                                                            <span className="text-[10px] text-white/40">
                                                                No weapon
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-semibold text-white/95">
                                                                {role.name || "Unnamed role"}
                                                            </span>
                                                            {role.roleType && (
                                                                <span className={[
                                                                    "rounded-full px-2 py-0.5 text-[10px] ",
                                                                    " uppercase tracking-wide text-white/100 "
                                                                ].join(role_bg_color)}
                                                                >
                                                                    {role.roleType}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {role.description && (
                                                            <div className="mt-0.5 line-clamp-2 text-[11px] text-white/60">
                                                                {role.description}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex flex-col gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditRole(idx)}
                                                            className="rounded-md bg-white/15 px-2 py-1 text-[11px] font-semibold hover:bg-white/25"
                                                        >
                                                            Config Role
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteRole(idx)}
                                                            className="rounded-md bg-red-700/80 px-2 py-1 text-[11px] font-semibold hover:bg-red-800"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Save group */}
                                <div className="mt-3 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setOpen(false);
                                            resetGroup();
                                        }}
                                        className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        disabled={!canSave}
                                        onClick={handleSaveGroup}
                                        className={[
                                            "rounded-lg px-4 py-2 text-sm font-semibold",
                                            canSave
                                                ? " bg-[#0b4e97] hover:bg-[#2273c5]"
                                                : " bg-blue-600/40 cursor-not-allowed",
                                        ].join(" ")}
                                    >
                                        {saving ? "Saving…" : "Save Group"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Role modal */}
                    <RoleAddModal
                        open={roleModalOpen}
                        initialRole={
                            editingIndex !== null ? roles[editingIndex] : undefined
                        }
                        onCancel={() => {
                            setRoleModalOpen(false);
                            setEditingIndex(null);
                        }}
                        onSave={handleRoleSave}
                    />
                </div>
            )}
        </>
    );
}
