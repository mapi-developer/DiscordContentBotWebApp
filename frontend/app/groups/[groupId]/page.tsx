import Link from "next/link";

export const dynamic = "force-dynamic";

type Group = {
    id: string;
    uuid: string;
    name: string;
    description?: string | null;
    role_type?: string | null;
    tags?: string[] | null;
    items: Record<string, string>;
    creator_id: string;
    created_at?: string;
};

type PageProps = {
    params: Promise<{ groupId: string }>;
};

export default async function GroupDetailPage({ params }: PageProps) {
    const { groupId } = await params;
    const base = process.env.BACKEND_URL ?? "http://localhost:8000";
    const res = await fetch(`${base}/groups/${groupId}`, {
        cache: "no-store",
    });

    if (!res.ok) {
        // Simple 404-ish fallback – you can later switch to notFound() if you want
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
                        We couldn't find a group with id{" "}
                        <code className="text-xs">{groupId}</code>.
                    </p>
                </div>
            </main>
        );
    }

    const group: Group = await res.json();

    const createdAt = group.created_at
        ? new Date(group.created_at)
        : null;

    const slotsOrder: { key: keyof Group["items"]; label: string }[] = [
        { key: "weapon", label: "Weapon" },
        { key: "off_hand", label: "Off hand" },
        { key: "head", label: "Head" },
        { key: "armor", label: "Armor" },
        { key: "shoes", label: "Shoes" },
        { key: "cape", label: "Cape" },
        { key: "bag", label: "Bag" },
        { key: "potion", label: "Potion" },
        { key: "food", label: "Food" },
        { key: "mount", label: "Mount" },
    ];

    return (
        <main className="min-h-screen bg-[#020617] text-white">
            <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
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

                {/* Header */}
                <header className="space-y-2">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {group.name}
                    </h1>
                    <p className="text-sm text-white/70">
                        {group.description || "No description provided."}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/60">
                        {createdAt && (
                            <span>
                                Created{" "}
                                {createdAt.toLocaleDateString()}{" "}
                                at {createdAt.toLocaleTimeString()}
                            </span>
                        )}
                        <span>
                            ID:{" "}
                            <code className="text-[10px]">
                                {group.id}
                            </code>
                        </span>
                        <span>
                            UUID:{" "}
                            <code className="text-[10px]">
                                {group.uuid}
                            </code>
                        </span>
                        <span>Creator: {group.creator_id}</span>
                    </div>
                </header>

                {/* Tags / role_type */}
                <section className="space-y-2">
                    <h2 className="text-sm font-semibold text-white">
                        Tags & type
                    </h2>
                    <div className="flex flex-wrap gap-2 text-xs">
                        {group.role_type && (
                            <span className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 text-white/80">
                                Role type: {group.role_type}
                            </span>
                        )}
                        {group.tags && group.tags.length > 0 ? (
                            group.tags.map((tag, idx) => (
                                <span
                                    key={`${tag}-${idx}`}
                                    className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 text-white/80"
                                >
                                    {tag}
                                </span>
                            ))
                        ) : (
                            <span className="text-white/50">
                                No tags assigned.
                            </span>
                        )}
                    </div>
                </section>

                {/* Items table */}
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold text-white">
                        Equipped items
                    </h2>
                    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
                        <table className="min-w-full text-left text-xs">
                            <thead className="border-b border-white/10 bg-white/5">
                                <tr>
                                    <th className="px-4 py-2 font-semibold text-white/80">
                                        Slot
                                    </th>
                                    <th className="px-4 py-2 font-semibold text-white/80">
                                        Item db name
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {slotsOrder.map(({ key, label }) => {
                                    const value = group.items?.[key as string];
                                    return (
                                        <tr
                                            key={key as string}
                                            className="border-t border-white/5 text-white/80"
                                        >
                                            <td className="px-4 py-2 text-white/70">
                                                {label}
                                            </td>
                                            <td className="px-4 py-2 font-mono text-[11px]">
                                                {value || <span className="text-white/40">—</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </main>
    );
}
