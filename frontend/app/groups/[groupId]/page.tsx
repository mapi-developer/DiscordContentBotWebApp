import Link from "next/link";
import type { Group } from "@/src/types/group";
import { API_BASE } from "@/src/lib/api";
import CopyUuidButton from "@/src/components/common/copy-uuid-button";
import GroupShow from "@/src/components/groups/role-show";

const SPECIAL_TYPES = ["MEAL", "POTION", "MOUNT"] as const;

type Role = {
    id: string;
    uuid: string;
    name: string;
    description?: string | null;
    role_type: string;
    items: Record<string, string | null>;
    created_at: string;
};

type PageProps = {
    // 👇 in Next 15 / React 19 app router, params is a Promise
    params: Promise<{ groupId: string }>;
};

export const dynamic = "force-dynamic";

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

async function fetchGroup(groupUuid: string): Promise<Group | null> {
    // Uses your /groups/by-uuid/{uuid} endpoint
    const res = await fetch(`${API_BASE}/groups/${groupUuid}`, {
        cache: "no-store",
    });

    if (!res.ok) return null;
    return res.json();
}

async function fetchRolesForGroup(group: Group): Promise<Role[]> {
    const rawRoles = (group as any).roles as string[] | undefined;
    if (!rawRoles || !Array.isArray(rawRoles) || rawRoles.length === 0) {
        return [];
    }

    const params = new URLSearchParams();
    params.set("uuids", rawRoles.join(","));

    const res = await fetch(`${API_BASE}/roles?${params.toString()}`, {
        cache: "no-store",
    });

    if (!res.ok) return [];
    return res.json();
}

export default async function GroupDetailPage({ params }: PageProps) {
    // 🔑 unwrap params
    const { groupId } = await params; // groupId is actually the group UUID in the URL

    const group = await fetchGroup(groupId);

    if (!group) {
        return (
            <main className="min-h-screen bg-[#020617] text-white">
                <div className="mx-auto max-w-4xl px-4 py-8 space-y-4">
                    <Link
                        href="/groups"
                        className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"
                    >
                        <span className="text-lg">←</span>
                        <span>Back to groups</span>
                    </Link>

                    <h1 className="text-2xl font-semibold tracking-tight">
                        Group not found
                    </h1>
                    <p className="text-sm text-white/60">
                        We couldn't find a group with uuid{" "}
                        <code className="text-xs break-all">{groupId}</code>.
                    </p>
                </div>
            </main>
        );
    }

    const createdAt = group.created_at ? new Date(group.created_at) : null;
    const roles = await fetchRolesForGroup(group);

    return (
        <main className="min-h-screen bg-[#020617] text-white">
            <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
                {/* Back link */}
                <div className="flex items-center justify-between gap-4">
                    <Link
                        href="/groups"
                        className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"
                    >
                        <span className="text-lg">←</span>
                        <span>Back to groups</span>
                    </Link>
                </div>

                {/* Group header */}
                <section className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                            <h1 className="text-2xl font-semibold tracking-tight">
                                {group.name}
                            </h1>
                            <p className="text-sm text-white/70">
                                {group.description || "No description provided for this group."}
                            </p>
                        </div>
                    </div>

                    <div className="mt-3 grid gap-2 text-[11px] text-white/65 sm:grid-cols-2">
                        <div className="space-y-1">
                            {createdAt && (
                                <div>
                                    <span className="text-white/45">Created: </span>
                                    {createdAt.toLocaleDateString()}{" "}
                                    {createdAt.toLocaleTimeString()}
                                </div>
                            )}
                            <div>
                                <span className="text-white/45">Creator ID: </span>
                                {group.creator_id || (
                                    <span className="text-white/40">unknown</span>
                                )}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-white/45">Group UUID:</span>
                                {group.uuid && (
                                    <CopyUuidButton value={group.uuid} />
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Roles list */}
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
                            Roles in this group
                        </h2>
                        <span className="text-[11px] text-white/60">
                            {roles.length} role{roles.length === 1 ? "" : "s"}
                        </span>
                    </div>

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
                                const created =
                                    role.created_at && new Date(role.created_at);

                                return (
                                    <div
                                        key={role.uuid}
                                        className={[
                                            "flex gap-3 rounded-xl border border-white/10 bg-black/40 p-4 ",
                                            "cursor-pointer transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-lg ",
                                            "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 hover:bg-[#11234d]"
                                        ].join()}
                                    >
                                        {/* Set preview */}
                                        <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-white/15 bg-black/70">
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
                                                <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/80">
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
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
            <GroupShow />
        </main>
    );
}
