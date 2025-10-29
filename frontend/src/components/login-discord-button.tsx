"use client";

import { useEffect, useState } from "react";
import { API_BASE, getMe } from "@/src/lib/api";
import { SiDiscord } from "react-icons/si";

type Me = {
    user: {
        created_at: string,
        discord: {
            avatar: string,
            email: string,
            global_name: string,
            id: string,
            username: string
        },
        updated_at: string
    }
};

function discordAvatarUrl(userId: string, avatarId?: string | null, size: 64 | 128 | 256 | 512 | 1024 | 2048 | 4096 = 64) {
  if (avatarId) {
    const ext = avatarId.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${userId}/${avatarId}.${ext}?size=${size}`;
  }
  // default avatar (generic)
  return "https://cdn.discordapp.com/embed/avatars/0.png";
}

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

    const avatarUrl = discordAvatarUrl(me.user.discord.id, me.user.discord.avatar, 128);
    const displayName = me.user.discord.global_name || me.user.discord.username || "User";

    return (
        <div className="flex items-center gap-3">
            <img
                src={avatarUrl}
                className="h-8 w-8 rounded-full border"
            />
            <span className="text-sm">{displayName}</span>
            <form
                action={`${API_BASE}/auth/discord/logout`}
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
