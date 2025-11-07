"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { RoleInputPayload } from "@/src/types/group";
import type { Item } from "@/src/types/item";

const SPECIAL_TYPES = ["MEAL", "POTION", "MOUNT"] as const;

function getRoleColor(role: RoleInputPayload | null): string {
    if (!role) return "";

    if (role.role_type === "Tank") {
        return "bg-[#033c82]";
    }
    else if (role.role_type === "Healer") {
        return "bg-[#0b8717]";
    }
    else if (role.role_type === "Support") {
        return "bg-[#a69603]";
    }
    else if (role.role_type === "Range DD") {
        return "bg-[#c27408]";
    }
    else if (role.role_type === "Melee DD") {
        return "bg-[#ad1d07]";
    }
    else if (role.role_type === "Battle Mount") {
        return "bg-[#6b6b6a]";
    }
    else {
        return "bg-[#666666]";
    }
}

export type SlotId =
    | "bag"
    | "cape"
    | "head"
    | "armor"
    | "shoes"
    | "weapon"
    | "off_hand"
    | "potion"
    | "food"
    | "mount";

async function fetchRoleByUuid(uuid: string): Promise<RoleInputPayload> {
    // POINT THIS to your backend route. See backend snippet below.
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/roles/${uuid}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load role");
    return res.json();
}

function getItemIcon(item: string | null): string | null {
    if (!item) return null;
    const isSpecial = SPECIAL_TYPES.some((el) =>
        item.includes(el),
    );
    return isSpecial
        ? `https://render.albiononline.com/v1/item/${item}`
        : `https://render.albiononline.com/v1/item/T8_${item}`;
}

function Slot(props: {
    slot_id: SlotId;
    slot_item: string | null;
    className?: string;
    disabled?: boolean;
}) {
    const {
        slot_id,
        slot_item,
        className,
        disabled = false,
    } = props;

    const img_src = getItemIcon(slot_item);

    return (
        <div
            className={[
                "w-full aspect-square rounded-2xl border-2 bg-black/60",
                "shadow-[0_0_0_2px_rgba(255,255,255,0.05)_inset] flex items-center justify-center",
                "transition-colors outline-none relative",
                disabled
                    ? "border-white/10 opacity-40 cursor-not-allowed"
                    : "border-white/30 hover:border-white/50 cursor-pointer",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            {img_src ? (
                <img
                    src={img_src}
                    className="h-full w-full object-contain"
                />
            ) : (
                <span className="text-[10px] uppercase tracking-wide text-white/40">
                    Empty
                </span>
            )}
        </div>
    );
}

export default function RoleShowModal({
    roleUuid,
    open,
    onClose,
}: {
    roleUuid: string | null;
    open: boolean;
    onClose: () => void;
}) {
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState<RoleInputPayload | null>(null);
    const [copied, setCopied] = useState<string | null>(null);
    const [offHandDisabled, setOffHandDisabled] = useState(false);
    const [offHandMirrorsWeapon, setOffHandMirrorsWeapon] = useState(false);

    useEffect(() => setMounted(true), []);

    // Load role when opened + uuid changes
    useEffect(() => {
        let alive = true;
        async function load() {
            if (!open || !roleUuid) return;
            setLoading(true);
            try {
                const data = await fetchRoleByUuid(roleUuid);
                if (alive) setRole(data);
            } catch (e) {
                console.error(e);
                if (alive) setRole(null);
            } finally {
                if (alive) setLoading(false);
            }
        }
        load();
        return () => { alive = false; };
    }, [open, roleUuid]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    React.useEffect(() => { if (!open) setCopied(null); }, [open]);

    if (!open || !mounted) return null;

    const isTwoHanded = !!role?.items?.weapon && role.items.weapon?.includes("2H_");

    const copyText = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(text);
            setTimeout(() => setCopied(null), 1200);
        } catch { }
    };

    const role_bg_color = getRoleColor(role)

    const modal = (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
            <div className="w-full max-w-max rounded-2xl border border-white/10 bg-[#0b0f17] p-5">

                <div className="grid gap-6 md:grid-cols-[300px_1px_650px]">
                    {/* Left Side */}
                    <div className="grid grid-rows-[50%_50%]">
                        <div className="bg-[url('/character-bg.svg')] bg-no-repeat w-[80%] bg-position:[50%_2px] place-self-center">
                            <div
                                className="grid gap-x-5 gap-y-2.5 grid-cols-3 grid-rows-[auto_auto_auto_auto] place-items-center"
                            >
                                {/* Row 1 */}
                                <Slot
                                    slot_id="bag"
                                    className="col-start-1 row-start-1"
                                    slot_item={role === null ? "" : role?.items.bag}
                                />
                                <Slot
                                    slot_id="head"
                                    className="col-start-2 row-start-1"
                                    slot_item={role === null ? "" : role?.items.head}
                                />
                                <Slot
                                    slot_id="cape"
                                    className="col-start-3 row-start-1"
                                    slot_item={role === null ? "" : role?.items.cape}
                                />

                                {/* Row 2 */}
                                <Slot
                                    slot_id="weapon"
                                    className="col-start-1 row-start-2"
                                    slot_item={role === null ? "" : role?.items.weapon}
                                />
                                <Slot
                                    slot_id="armor"
                                    className="col-start-2 row-start-2"
                                    slot_item={role === null ? "" : role?.items.armor}
                                />
                                <Slot
                                    slot_id="off_hand"
                                    className="col-start-3 row-start-2"
                                    slot_item={
                                        offHandMirrorsWeapon
                                            ? role === null ? "" : role?.items.weapon
                                            : role === null ? "" : role?.items.off_hand
                                    }
                                    disabled={offHandDisabled}
                                />

                                {/* Row 3 */}
                                <Slot
                                    slot_id="potion"
                                    className="col-start-1 row-start-3"
                                    slot_item={role === null ? "" : role?.items.potion}
                                />
                                <Slot
                                    slot_id="shoes"
                                    className="col-start-2 row-start-3"
                                    slot_item={role === null ? "" : role?.items.shoes}
                                />
                                <Slot
                                    slot_id="food"
                                    className="col-start-3 row-start-3"
                                    slot_item={role === null ? "" : role?.items.food}
                                />

                                {/* Extra bottom-center row (Row 4, col 2) */}
                                <Slot
                                    slot_id="mount"
                                    className="col-start-2 row-start-4"
                                    slot_item={role === null ? "" : role?.items.mount}
                                />
                            </div>
                        </div>
                        <div className="mt-[5%]">
                            <label className="block">
                                <div className="mt-2 mb-1.5 text-m font-medium text-white/90">
                                    Role Name
                                </div>
                                <div className="w-full rounded-lg border border-white/25 bg-black/60 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20">
                                    {role?.name}
                                </div>
                            </label>
                            <label className="block">
                                <div className="mt-2 mb-1.5 text-m font-medium text-white/90">
                                    Role Description
                                </div>
                                <textarea
                                    disabled
                                    value={role?.description === null ? "" : role?.description}
                                    rows={3}
                                    className="select-none w-full rounded-lg border border-white/25 bg-black/60 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20 resize-none"
                                />
                            </label>
                            <label className="block">
                                <div className="mt-0.5 mb-1.5 text-m font-medium text-white/90">
                                    Role Type
                                </div>
                                <div className="flex items-center gap-3 flex-wrap justify-between">
                                    <div className="relative w-[50%] ">
                                        <div
                                            className={[
                                                "w-full appearance-none pr-10 ",
                                                " rounded-lg border border-white/25 ",
                                                " px-3 py-2 outline-none ",
                                                " focus:ring-2 focus:ring-white/20 ",
                                                " text-white "
                                            ].join(role_bg_color)}
                                        >
                                            {role?.role_type === null ? "" : role?.role_type}
                                        </div>
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>
                    <div className="hidden md:block w-px bg-white/25 h-150" ></div>
                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <div className="text-xl color-white font-bold"></div>
                            <div className="flex justify-end">
                                <button
                                    onClick={() => onClose()}
                                    className="rounded-md px-2 py-1.5 text-sm font-bold
                                    bg-[#666666]/0 hover:bg-[#212121] text-white transition
                                    border border-white/30
                                "
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );

    return createPortal(modal, document.body);
}
