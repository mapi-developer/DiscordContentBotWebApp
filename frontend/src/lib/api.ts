import type { Group, GroupCreatePayload } from "@/src/types/group";

export const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_BASE ??
  "http://localhost:8000";

export async function getMe() {
  const res = await fetch(`${API_BASE}/auth/discord/me`, {
    credentials: "include",
  });
  if (!res.ok) return null;
  return res.json();
}

export async function createGroup(
  payload: GroupCreatePayload,
): Promise<Group> {
  const res = await fetch(`${API_BASE}/groups`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to create group (${res.status})`);
  }

  return res.json();
}
