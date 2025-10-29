"use client";
import { useEffect, useState } from "react";

export default function SuccessPage() {
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/discord/me`, {
          credentials: "include",
        });
        if (!res.ok) {
          setError(`Failed to load session (${res.status})`);
          return;
        }
        const data = await res.json();
        setUser(data.user);
        // optional: read ?next from URL and redirect
        const params = new URLSearchParams(window.location.search);
        const next = params.get("next");
        if (next) window.location.replace(next);
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, []);

  if (error) return <div className="p-6">Auth error: {error}</div>;
  if (!user) return <div className="p-6">Signing you in…</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Welcome, {user.discord?.global_name ?? user.discord?.username}!</h1>
      <p className="opacity-80">You’re signed in with Discord.</p>
    </div>
  );
}
