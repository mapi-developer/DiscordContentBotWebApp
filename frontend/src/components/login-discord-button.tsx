"use client";

import { useEffect, useState } from "react";
import { API_BASE, getMe } from "@/src/lib/api";
import { SiDiscord } from "react-icons/si";

type Me = {
    id: string;
    username: string;
    global_name?: string | null;
    avatar_url?: string | null;
};

export default function LogInDiscordButton() {
    const [me, setMe] = useState<Me | null>(null);
    const [loading, setLoading] = useState(true);
    const [redirecting, setRedirecting] = useState(false);

    useEffect(() => {
        getMe().then((u) => {
            setMe(u);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="h-9 w-24 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
        );
    }

    if (!me) {
        return (
            <button
                onClick={() => {
                    setRedirecting(true);
                    const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
                    const next = typeof window !== "undefined" ? window.location.pathname : "/";
                    window.location.href = `${api}/auth/discord/login?next=${encodeURIComponent(next)}`;
                }}
                disabled={redirecting}
                className="w-full rounded-xl border border-white/10 bg-[#074ab5] px-4 py-3 text-sm font-semibold hover:bg-[#0960eb] transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
                <SiDiscord size={18} />
                {redirecting ? "Redirecting..." : "Log in with Discord"}
            </button>
        );
    }

    return (
        <div className="flex items-center gap-3">
            <img
                src={me.avatar_url ?? ""}
                alt={me.global_name ?? me.username}
                className="h-9 w-9 rounded-full border"
            />
            <span className="text-sm">{me.global_name ?? me.username}</span>
            <form
                action={`${API_BASE}/auth/logout`}
                method="post"
            >
                <button
                    className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50 dark:hover:bg-gray-800"
                    type="submit"
                >
                    Logout
                </button>
            </form>
        </div>
    );
}
