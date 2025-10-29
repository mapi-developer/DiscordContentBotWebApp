"use client";

import { useEffect, useState } from "react";

type Group = {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string;
};

export default function GroupsList({ initialGroups }: { initialGroups: Group[] }) {
  const [groups, setGroups] = useState<Group[]>(initialGroups ?? []);
  const [loading, setLoading] = useState(false);
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  async function refresh() {
    setLoading(true);
    try {
      const r = await fetch(`${base}/groups`, { cache: "no-store" });
      if (r.ok) setGroups(await r.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const bc = new BroadcastChannel("groups");
    bc.onmessage = (e) => {
      if (e.data === "refresh") refresh();
    };
    return () => bc.close();
  }, []);

  if (!groups?.length) {
    return (
      <div className="rounded-xl border border-white/10 p-8 text-center">
        <p className="text-white/70">No groups yet.</p>
        <p className="text-white/40 text-sm mt-2">Use the “Add Group” button to create one.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {groups.map((g) => (
        <div key={g.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-medium">{g.name}</h3>
              {g.description ? (
                <p className="mt-1 text-sm text-white/70">{g.description}</p>
              ) : (
                <p className="mt-1 text-sm text-white/40 italic">No description</p>
              )}
            </div>
            {g.created_at && (
              <span className="text-xs text-white/40">
                {new Date(g.created_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      ))}
      {loading && (
        <div className="rounded-xl border border-white/10 p-4 text-sm text-white/60">
          Refreshing…
        </div>
      )}
    </div>
  );
}
