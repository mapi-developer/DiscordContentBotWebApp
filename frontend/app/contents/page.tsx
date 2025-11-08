"use client";

import React from "react";
import CopyUuidButton from "@/src/components/common/copy-uuid-button";
import { API_BASE } from "@/src/lib/api";

type ContentCall = {
    uuid: string;
    title: string;
    description?: string | null;
    content_type: string;            // e.g. "ZvZ", "Ganking", "Fame Farm", ...
    location?: string | null;
    start_time?: string | null;      // ISO string
    max_players?: number | null;
    roles_needed?: string[];         // e.g. ["Tank", "Healer", "Support"]
    created_by?: string | null;
    created_at?: string | null;
};

const CONTENT_TYPES = [
    "ZvZ",
    "Small-Scale",
    "Ganking",
    "Fame Farm",
    "Hellgates",
    "Avalon Roads",
    "Mists",
    "Crystal League",
    "Other",
] as const;

function clsx(...arr: (string | false | null | undefined)[]) {
    return arr.filter(Boolean).join(" ");
}

export default function ContentsPage() {
    const [items, setItems] = React.useState<ContentCall[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    // form state
    const [title, setTitle] = React.useState("");
    const [contentType, setContentType] = React.useState<(typeof CONTENT_TYPES)[number]>("ZvZ");
    const [location, setLocation] = React.useState("");
    const [startTime, setStartTime] = React.useState<string>("");
    const [maxPlayers, setMaxPlayers] = React.useState<number | "">("");
    const [desc, setDesc] = React.useState("");
    const [roleInput, setRoleInput] = React.useState("");
    const [rolesNeeded, setRolesNeeded] = React.useState<string[]>([]);
    const [submitting, setSubmitting] = React.useState(false);

    React.useEffect(() => {
        let alive = true;
        async function load() {
            setLoading(true);
            setError(null);
            try {
                // Adjust this endpoint to your backend route once you add it.
                const res = await fetch(`${API_BASE}/contents`, { cache: "no-store" });
                if (!res.ok) throw new Error(`Failed to load contents (${res.status})`);
                const data: ContentCall[] = await res.json();
                if (alive) setItems(Array.isArray(data) ? data : []);
            } catch (e: any) {
                if (alive) setError(e?.message || "Failed to load contents");
            } finally {
                if (alive) setLoading(false);
            }
        }
        load();
        return () => { alive = false; };
    }, []);

    // roles-needed: add on SPACE
    const onRoleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
        if (e.key === " " && roleInput.trim()) {
            e.preventDefault();
            const val = roleInput.trim();
            if (!rolesNeeded.includes(val)) {
                setRolesNeeded((x) => [...x, val]);
            }
            setRoleInput("");
        }
        if (e.key === "Backspace" && !roleInput && rolesNeeded.length) {
            setRolesNeeded((x) => x.slice(0, -1));
        }
    };

    const removeRole = (r: string) => {
        setRolesNeeded((x) => x.filter((i) => i !== r));
    };

    const resetForm = () => {
        setTitle("");
        setContentType("ZvZ");
        setLocation("");
        setStartTime("");
        setMaxPlayers("");
        setDesc("");
        setRoleInput("");
        setRolesNeeded([]);
    };

    const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        setSubmitting(true);
        setError(null);
        try {
            const payload = {
                title: title.trim(),
                description: desc.trim() || null,
                content_type: contentType,
                location: location.trim() || null,
                start_time: startTime ? new Date(startTime).toISOString() : null,
                max_players: maxPlayers === "" ? null : Number(maxPlayers),
                roles_needed: rolesNeeded,
            };

            const res = await fetch(`${API_BASE}/contents`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || `Create failed (${res.status})`);
            }
            const created: ContentCall = await res.json();

            // optimistic add to the top
            setItems((prev) => [created, ...prev]);
            resetForm();
        } catch (e: any) {
            setError(e?.message || "Failed to create content call");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#020617] text-white">
            <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
                {/* Header */}
                <header className="flex flex-col gap-2">
                    <h1 className="text-2xl font-semibold tracking-tight">Content Calls</h1>
                    <p className="text-sm text-white/70">
                        Create and manage Albion Online content calls (ZvZ, ganking, fame farms, and more).
                    </p>
                </header>

                {/* Creator */}
                <section className="rounded-2xl border border-white/10 bg-black/40 p-6">
                    <h2 className="text-sm font-semibold tracking-wide uppercase text-white/80">
                        Create new content call
                    </h2>

                    <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="md:col-span-1">
                            <label className="text-xs uppercase tracking-wide text-white/50">Title</label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="mt-1 w-full rounded-lg border border-white/25 bg-black/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
                                placeholder="e.g., ZvZ in Thetford, CTA at 19:00"
                            />
                        </div>

                        <div className="md:col-span-1">
                            <label className="text-xs uppercase tracking-wide text-white/50">Content Type</label>
                            <select
                                value={contentType}
                                onChange={(e) => setContentType(e.target.value as any)}
                                className="mt-1 w-full rounded-lg border border-white/25 bg-black/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
                            >
                                {CONTENT_TYPES.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-1">
                            <label className="text-xs uppercase tracking-wide text-white/50">Start time</label>
                            <input
                                type="datetime-local"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-white/25 bg-black/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
                            />
                        </div>

                        <div className="md:col-span-1">
                            <label className="text-xs uppercase tracking-wide text-white/50">Max players</label>
                            <input
                                type="number"
                                min={1}
                                value={maxPlayers}
                                onChange={(e) => setMaxPlayers(e.target.value === "" ? "" : Number(e.target.value))}
                                className="mt-1 w-full rounded-lg border border-white/25 bg-black/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
                                placeholder="e.g., 20"
                            />
                        </div>

                        <div className="md:col-span-1">
                            <label className="text-xs uppercase tracking-wide text-white/50">Location</label>
                            <input
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-white/25 bg-black/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
                                placeholder="e.g., Thetford portal / Avalonian Roads"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="text-xs uppercase tracking-wide text-white/50">Description</label>
                            <textarea
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                                rows={3}
                                className="mt-1 w-full rounded-lg border border-white/25 bg-black/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
                                placeholder="Rules, required IP, voice channel, regroup time, loot rules, etc."
                            />
                        </div>

                        {/* roles needed with space-to-add */}
                        <div className="md:col-span-2">
                            <label className="text-xs uppercase tracking-wide text-white/50">Roles needed (press space to add)</label>
                            <div className="mt-1 flex flex-wrap items-center gap-2 rounded-lg border border-white/25 bg-black/60 px-3 py-2">
                                {rolesNeeded.map((r) => (
                                    <span
                                        key={r}
                                        className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold"
                                    >
                                        {r}
                                        <button
                                            type="button"
                                            onClick={() => removeRole(r)}
                                            className="rounded p-0.5 hover:bg-white/10"
                                            aria-label={`Remove ${r}`}
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                                <input
                                    value={roleInput}
                                    onChange={(e) => setRoleInput(e.target.value)}
                                    onKeyDown={onRoleKeyDown}
                                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
                                    placeholder="Tank Healer Support ..."
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
                            >
                                Reset
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className={clsx(
                                    "rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black",
                                    submitting && "opacity-60"
                                )}
                            >
                                {submitting ? "Creating…" : "Create"}
                            </button>
                        </div>

                        {error && (
                            <div className="md:col-span-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                                {error}
                            </div>
                        )}
                    </form>
                </section>

                {/* List */}
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
                            Existing content calls
                        </h2>
                        <span className="text-[11px] text-white/60">
                            {loading ? "…" : `${items.length} item${items.length === 1 ? "" : "s"}`}
                        </span>
                    </div>

                    {loading && (
                        <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-6 text-sm text-white/70">
                            Loading…
                        </div>
                    )}

                    {!loading && !items.length && (
                        <div className="rounded-xl border border-dashed border-white/20 bg-black/40 px-4 py-6 text-sm text-white/70">
                            No content calls yet. Create your first one above.
                        </div>
                    )}

                    {!!items.length && (
                        <div className="space-y-2">
                            {items.map((it) => {
                                const created = it.created_at ? new Date(it.created_at) : null;
                                const starts = it.start_time ? new Date(it.start_time) : null;

                                return (
                                    <article
                                        key={it.uuid}
                                        className="rounded-xl border border-white/10 bg-black/40 p-4"
                                    >
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="truncate text-sm font-semibold">{it.title}</h3>
                                                    <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/80">
                                                        {it.content_type}
                                                    </span>
                                                    {it.location && (
                                                        <span className="text-[11px] text-white/60">
                                                            • {it.location}
                                                        </span>
                                                    )}
                                                </div>
                                                {it.description && (
                                                    <p className="mt-1 line-clamp-2 text-xs text-white/70">
                                                        {it.description}
                                                    </p>
                                                )}
                                                <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-white/60">
                                                    {starts && (
                                                        <span>
                                                            Starts: {starts.toLocaleDateString()} {starts.toLocaleTimeString()}
                                                        </span>
                                                    )}
                                                    {created && (
                                                        <span>
                                                            Created: {created.toLocaleDateString()} {created.toLocaleTimeString()}
                                                        </span>
                                                    )}
                                                    {typeof it.max_players === "number" && (
                                                        <span>Max players: {it.max_players}</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {it.uuid && <CopyUuidButton value={it.uuid} />}
                                            </div>
                                        </div>

                                        {!!(it.roles_needed?.length) && (
                                            <div className="mt-3 flex flex-wrap gap-1.5">
                                                {it.roles_needed!.map((r) => (
                                                    <span
                                                        key={r}
                                                        className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px]"
                                                    >
                                                        {r}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
