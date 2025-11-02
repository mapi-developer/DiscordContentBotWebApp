import Link from "next/link";
import ConfigRole from "@/src/components/groups/role-add";
import AddGroup from "@/src/components/groups/groups-add";
import GroupsList from "@/src/components/groups/groups-list";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const base = process.env.BACKEND_URL ?? "http://localhost:8000";
  const r = await fetch(`${base}/groups`, { cache: "no-store" });
  const groups = r.ok ? await r.json() : [];

  return (
    <main className="mx-auto max-w-5xl px-6 py-2">
      <Link href="/" className="hover:underline">← Back to Home</Link>

      <div className="mb-6 flex items-center justify-between py-2">
        <h1 className="text-2xl font-semibold tracking-tight">Groups</h1>
        {/* <AddGroup /> */}
        <ConfigRole />
      </div>

      <GroupsList initialGroups={groups} />
    </main>
  );
}
