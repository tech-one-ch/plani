import { getDb, organizations, users } from "@plani/db";
import { count, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const db = getDb();

  const [userCount, orgCount, adminCount] = await Promise.all([
    db
      .select({ total: count() })
      .from(users)
      .then((r) => r[0]?.total ?? 0),
    db
      .select({ total: count() })
      .from(organizations)
      .then((r) => r[0]?.total ?? 0),
    db
      .select({ total: count() })
      .from(users)
      .where(eq(users.role, "admin"))
      .then((r) => r[0]?.total ?? 0),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">Instance overview</h1>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total users" value={String(userCount)} />
        <StatCard label="Organizations" value={String(orgCount)} />
        <StatCard label="Instance admins" value={String(adminCount)} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-zinc-900">{value}</p>
    </div>
  );
}
