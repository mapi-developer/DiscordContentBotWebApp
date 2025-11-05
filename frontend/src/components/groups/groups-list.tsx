"use client";

import { useEffect, useMemo, useState } from "react";
import { getMe } from "@/src/lib/api";
import type { Group } from "@/src/types/group";
import type { RoleInputPayload } from "@/src/types/group";

type Me = {
  user: {
    discord: {
      id: string;
      username?: string;
      global_name?: string;
      avatar?: string | null;
      email?: string;
    };
    created_at: string;
    updated_at: string;
  };
};

type Props = {
  initialGroups: Group[];
};

const BACKEND =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const SPECIAL_TYPES = ["MEAL", "POTION", "MOUNT"] as const;

function getItemIcon(role: RoleInputPayload | null): string | null {
  console.log(role);
  if (!role) return null;

  let item = role.items.weapon;

  if (role.role_type === "Battle Mount") {
    item = role.items.mount;
  }

  if (!item) return null;

  const isSpecial = SPECIAL_TYPES.some((el) =>
    item.includes(el),
  );
  return isSpecial
    ? `https://render.albiononline.com/v1/item/${item}`
    : `https://render.albiononline.com/v1/item/T8_${item}`;
}

export default function GroupsList({ initialGroups }: Props) {
  const [groups, setGroups] = useState<Group[]>(initialGroups ?? []);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const [me, setMe] = useState<Me | null>(null);
  const [meLoading, setMeLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "mine">("all");

  const [rolesByUuid, setRolesByUuid] = useState<Record<string, RoleInputPayload>>({});
  const [loadingRoles, setLoadingRoles] = useState(false);

  async function refreshGroups() {
    setLoadingGroups(true);
    try {
      const res = await fetch(`${BACKEND}/groups`, { cache: "no-store" });
      if (res.ok) {
        const data: Group[] = await res.json();
        setGroups(data);
      }
    } finally {
      setLoadingGroups(false);
    }
  }

  // Refresh groups when a BroadcastChannel message arrives
  useEffect(() => {
    const bc = new BroadcastChannel("groups");
    bc.onmessage = (e) => {
      if (e.data === "refresh") {
        refreshGroups();
      }
    };
    return () => bc.close();
  }, []);

  // Load current Discord user
  useEffect(() => {
    getMe()
      .then((u) => {
        setMe(u);
        setMeLoading(false);
      })
      .catch(() => {
        setMe(null);
        setMeLoading(false);
      });
  }, []);

  const discordId = me?.user.discord.id ?? null;

  const visibleGroups = useMemo(() => {
    if (activeTab === "mine" && discordId) {
      return groups.filter((g) => g.creator_id === discordId);
    }
    return groups;
  }, [groups, activeTab, discordId]);

  const showLoginHint =
    activeTab === "mine" && !discordId && !meLoading;

  // Collect all role UUIDs from all groups and load them in one request
  useEffect(() => {
    const uuids = new Set<string>();
    for (const g of groups) {
      if (!g.roles) continue;
      for (const r of g.roles) {
        if (!r) continue;
        uuids.add(r);
      }
    }

    const allRoleUuids = Array.from(uuids);
    if (allRoleUuids.length === 0) {
      setRolesByUuid({});
      return;
    }

    let cancelled = false;

    async function loadRoles() {
      setLoadingRoles(true);
      try {
        const params = new URLSearchParams();
        params.set("uuids", allRoleUuids.join(","));

        const res = await fetch(`${BACKEND}/roles?${params.toString()}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          return;
        }

        const data: RoleInputPayload[] = await res.json();
        if (cancelled) return;

        const map: Record<string, RoleInputPayload> = {};
        for (const role of data) {
          if (role.uuid) {
            map[role.uuid] = role;
          }
        }
        setRolesByUuid(map);
      } finally {
        if (!cancelled) {
          setLoadingRoles(false);
        }
      }
    }

    loadRoles();

    return () => {
      cancelled = true;
    };
  }, [groups]);

  // ---- Render helpers ----

  function getGroupRolePreviews(g: Group): RoleInputPayload[] {
    if (!g.roles || g.roles.length === 0) return [];
    const out: RoleInputPayload[] = [];

    for (const uuid of g.roles) {
      const role = rolesByUuid[uuid];
      if (!role) continue;
      out.push(role);
      if (out.length >= 5) break;
    }

    return out;
  }

  // ---- Render ----

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-white/15 bg-black/40 p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={[
              "rounded-full px-3 py-1.5 font-medium transition",
              activeTab === "all"
                ? "bg-white text-black"
                : "text-white/70 hover:text-white",
            ].join(" ")}
          >
            All groups
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("mine")}
            className={[
              "rounded-full px-3 py-1.5 font-medium transition",
              activeTab === "mine"
                ? "bg-white text-black"
                : "text-white/70 hover:text-white",
            ].join(" ")}
          >
            My groups
          </button>
        </div>

        {(loadingGroups || loadingRoles) && (
          <span className="text-[11px] text-white/60">
            {loadingGroups
              ? "Refreshing groups…"
              : "Loading roles…"}
          </span>
        )}
      </div>

      {/* Login hint for "My groups" tab */}
      {showLoginHint && (
        <div className="rounded-xl border border-dashed border-white/20 bg-black/40 px-4 py-6 text-sm text-white/80">
          <p className="font-medium">Log in with Discord to see your groups.</p>
          <p className="mt-1 text-[13px] text-white/60">
            Once you create groups while logged in, they will appear under{" "}
            <span className="font-semibold">My groups</span>.
          </p>
        </div>
      )}

      {/* Empty state for current tab */}
      {!showLoginHint && !visibleGroups.length && !loadingGroups && (
        <div className="rounded-xl border border-dashed border-white/15 bg-black/40 px-4 py-8 text-center text-sm text-white/70">
          <p className="font-medium text-white">
            {activeTab === "mine"
              ? "You haven't created any groups yet."
              : "No groups yet."}
          </p>
          <p className="mt-1 text-[13px] text-white/60">
            Use the “Add Group” button to create one.
          </p>
        </div>
      )}

      {/* Groups list */}
      {!!visibleGroups.length && (
        <div className="space-y-3">
          {visibleGroups.map((g) => {
            const isMine = discordId && g.creator_id === discordId;
            const rolePreviews = getGroupRolePreviews(g);
            const totalRoles = g.roles?.length ?? 0;

            return (
              <div
                key={g.uuid ?? g.id}
                className="rounded-xl border border-white/10 bg-black/40 p-4"
              >
                <div className="gap-3">
                  {/* LEFT: name + description */}
                  <div className="min-w-0 flex-1">
                    <div className="items-start gap-2 grid grid-cols-[20%_70%_10%]">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold text-white">
                          {g.name}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-xs text-white/70">
                          {g.description || "No description"}
                        </p>
                        {g.created_at && (
                          <p className="mt-1 text-[11px] text-white/45">
                            Created{" "}
                            {new Date(g.created_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>


                      {rolePreviews.length > 0 && (
                        <div className="flex items-center gap-2 sm:pl-4">
                          <div className="flex -space-x-2">
                            {rolePreviews.map((role) => {
                              const src = getItemIcon(role);
                              const label = role.name || "Role";

                              if (!src) {
                                // Fallback: circle with first letter of role name
                                const initial =
                                  role.name?.trim().charAt(0).toUpperCase() ??
                                  "?";
                                return (
                                  <div
                                    key={role.uuid}
                                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/5 text-[10px] font-semibold text-white/80 shadow-sm"
                                    title={label}
                                  >
                                    {initial}
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={role.uuid}
                                  className="mx-0.5 h-16 w-16 overflow-hidden border border-black/60 bg-black/60 shadow-sm"
                                  title={label}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={src}
                                    alt={label}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              );
                            })}
                          </div>

                          {totalRoles > rolePreviews.length && (
                            <span className="text-[11px] text-white/60">
                              +{totalRoles - rolePreviews.length} more
                            </span>
                          )}
                        </div>
                      )}

                      {isMine && (
                        <div className="mr-6 ml-1 items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                          Your group
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
