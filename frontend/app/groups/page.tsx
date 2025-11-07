import Link from "next/link";
import GroupsList from "@/src/components/groups/groups-list";
import GroupAdd from "@/src/components/groups/group-add";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  const r = await fetch(`${base}/groups`, { cache: "no-store" });
  const groups = r.ok ? await r.json() : [];

  return (
    <main className="min-h-screen bg-linear-to-b from-[#050816] via-[#050816] to-black px-4 py-6 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-white/70 hover:text-white"
        >
          <span className="mr-2">←</span> Back to Home
        </Link>

        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Groups</h1>
            <p className="text-sm text-white/60">
              Create and manage groups and their roles.
            </p>
          </div>

          {/* Add Group button + modal */}
          <GroupAdd />
        </div>

        <GroupsList initialGroups={groups} />
      </div>
    </main>
  );
}
