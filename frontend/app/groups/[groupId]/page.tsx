import Link from "next/link";
import type { Group } from "@/src/types/group";
import { API_BASE } from "@/src/lib/api";
import CopyUuidButton from "@/src/components/common/copy-uuid-button";
import GroupRolesList, { Role } from "@/src/components/groups/group-roles-list"; // 👈 NEW import
// (You can remove: import RoleShowModal from "@/src/components/groups/role-show";)

export const dynamic = "force-dynamic";

const SPECIAL_TYPES = ["MEAL", "POTION", "MOUNT"] as const;

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

export default async function GroupDetailPage({ params }: { params: Promise<{ groupId: string }> }) {
    const { groupId } = await params;
    const group = await fetchGroup(groupId);

    if (!group) {
        return (
            <main className="min-h-screen bg-[#020617] text-white">
                <div className="mx-auto max-w-4xl px-4 py-8 space-y-4">
                    <Link href="/groups" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white">
                        <span className="text-lg">←</span>
                        <span>Back to groups</span>
                    </Link>

                    <h1 className="text-2xl font-semibold tracking-tight">Group not found</h1>
                    <p className="text-sm text-white/60">
                        We couldn't find a group with uuid <code className="text-xs break-all">{groupId}</code>.
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
                    <Link href="/groups" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white">
                        <span className="text-lg">←</span>
                        <span>Back to groups</span>
                    </Link>
                </div>

                {/* Group header */}
                <section className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                            <h1 className="text-2xl font-semibold tracking-tight">{group.name}</h1>
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
                                    {createdAt.toLocaleDateString()} {createdAt.toLocaleTimeString()}
                                </div>
                            )}
                            <div>
                                <span className="text-white/45">Creator ID: </span>
                                {group.creator_id || <span className="text-white/40">unknown</span>}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-white/45">Group UUID:</span>
                                {group.uuid && <CopyUuidButton value={group.uuid} />}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Roles list (client) */}
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold tracking-wide text-white uppercase">Roles in this group</h2>
                        <span className="text-[11px] text-white/60">
                            {roles.length} role{roles.length === 1 ? "" : "s"}
                        </span>
                    </div>

                    <GroupRolesList roles={roles} /> {/* 👈 now handles clicks + modal */}
                </section>
            </div>
        </main>
    );
}
