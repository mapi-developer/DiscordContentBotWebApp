import Link from "next/link";
import AddGroup from "@/src/components/groups/groups-add";
import GroupsList from "@/src/components/groups/groups-list";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const base = process.env.BACKEND_URL ?? "http://localhost:8000";
  const r = await fetch(`${base}/groups`, { cache: "no-store" });
  const groups = r.ok ? await r.json() : [];

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Groups</h1>
        <AddGroup />
      </header>

      <GroupsList initialGroups={groups} />

      <footer className="mt-10 text-sm text-white/50">
        <Link href="/" className="hover:underline">← Back to Home</Link>
      </footer>
    </main>
  );
}
