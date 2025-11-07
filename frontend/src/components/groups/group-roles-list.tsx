// /src/components/groups/group-roles-list.tsx
"use client";

import * as React from "react";
import RoleShowModal from "@/src/components/groups/role-show";

const SPECIAL_TYPES = ["MEAL", "POTION", "MOUNT"] as const;

export type Role = {
    id: string;
    uuid: string;
    name: string;
    description?: string | null;
    role_type: string;
    items: Record<string, string | null>;
    created_at: string;
};

function getRoleColor(role: Role | null): string {
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

function buildItemIconUrl(itemDbName: string | null | undefined): string | null {
    if (!itemDbName) return null;
    const isSpecial = SPECIAL_TYPES.some((el) => itemDbName.includes(el));
    return isSpecial
        ? `https://render.albiononline.com/v1/item/${itemDbName}`
        : `https://render.albiononline.com/v1/item/T8_${itemDbName}`;
}

function getRoleMainItemDbName(role: Role): string | null {
    // Default: main weapon
    let db = role.items?.weapon ?? null;

    // For battle mounts use mount slot if present
    if (role.role_type === "Battle Mount") {
        db = role.items?.mount ?? db;
    }

    return db ?? null;
}

export default function GroupRolesList({
    roles,
}: {
    roles: Role[];
}) {
    const [open, setOpen] = React.useState(false);
    const [roleUuid, setRoleUuid] = React.useState<string | null>(null);

    const onCardClick = (uuid: string) => {
        setRoleUuid(uuid);
        setOpen(true);
    };

    return (
        <>
            {!roles.length && (
                <div className="rounded-xl border border-dashed border-white/20 bg-black/40 px-4 py-6 text-sm text-white/70">
                    This group has no roles yet.
                </div>
            )}

            {!!roles.length && (
                <div className="space-y-2">
                    {roles.map((role) => {
                        const mainItemDb = getRoleMainItemDbName(role);
                        const iconUrl = buildItemIconUrl(mainItemDb);
                        const created = role.created_at && new Date(role.created_at);

                        const bgColor = getRoleColor(role);

                        return (
                            <button
                                key={role.uuid}
                                onClick={() => onCardClick(role.uuid)}
                                className={[
                                    "w-full text-left flex gap-3 rounded-xl border border-white/10 bg-black/40 p-4",
                                    "cursor-pointer transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-lg",
                                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 hover:bg-[#11234d]"
                                ].join(" ")}
                                aria-label={`Open ${role.name}`}
                            >
                                {/* Set preview */}
                                <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-white/15 bg-black/70 shrink-0">
                                    {iconUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={iconUrl}
                                            alt={role.name}
                                            className="h-full w-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-[10px] text-white/45 text-center px-1">
                                            No set preview
                                        </span>
                                    )}
                                </div>

                                {/* Role text */}
                                <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="truncate text-sm font-semibold text-white">
                                            {role.name}
                                        </p>
                                        <span className={[
                                            " inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ",
                                            " font-semibold uppercase tracking-wide text-white/80 "
                                        ].join(bgColor)}
                                        >
                                            {role.role_type}
                                        </span>
                                    </div>

                                    {role.description && (
                                        <p className="line-clamp-2 text-xs text-white/70">
                                            {role.description}
                                        </p>
                                    )}

                                    {created && (
                                        <p className="text-[10px] text-white/45">
                                            Role created {created.toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Modal (uses portal) */}
            <RoleShowModal
                roleUuid={roleUuid}
                open={open}
                onClose={() => setOpen(false)}
            />
        </>
    );
}
