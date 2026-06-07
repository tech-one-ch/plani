import { getDb, members, organizations } from "@plani/db";
import { count, desc, eq } from "drizzle-orm";
import { CreateOrgForm } from "./create-org-form";

export const dynamic = "force-dynamic";

export default async function AdminOrganizationsPage() {
  const db = getDb();

  const allOrgs = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      createdAt: organizations.createdAt,
      memberCount: count(members.id),
    })
    .from(organizations)
    .leftJoin(members, eq(members.organizationId, organizations.id))
    .groupBy(organizations.id, organizations.name, organizations.slug, organizations.createdAt)
    .orderBy(desc(organizations.createdAt));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Organizations</h1>
        <span className="text-sm text-zinc-500">{allOrgs.length} total</span>
      </div>

      {/* Create form */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-zinc-700">Create organization</h2>
        <CreateOrgForm />
      </div>

      {/* List */}
      {allOrgs.length === 0 ? (
        <p className="text-sm text-zinc-400">No organizations yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Slug</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Members</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {allOrgs.map((org) => (
                <tr key={org.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium text-zinc-900">{org.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-400">{org.slug}</td>
                  <td className="px-4 py-3 text-zinc-500">{Number(org.memberCount)}</td>
                  <td className="px-4 py-3 text-zinc-400">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
