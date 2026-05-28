import { getDb, users } from "@plani/db";
import { desc } from "drizzle-orm";
import { UserActions } from "./user-actions";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const db = getDb();

  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      banned: users.banned,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Users</h1>
        <span className="text-sm text-zinc-500">{allUsers.length} total</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-zinc-600">User</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-600">Role</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-600">Joined</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {allUsers.map((user) => (
              <tr key={user.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-zinc-900">{user.name}</div>
                  <div className="text-xs text-zinc-400">{user.email}</div>
                </td>
                <td className="px-4 py-3">
                  <RoleBadge role={user.role} />
                </td>
                <td className="px-4 py-3">
                  {user.banned ? (
                    <span className="font-medium text-red-500">Banned</span>
                  ) : user.emailVerified ? (
                    <span className="text-green-600">Verified</span>
                  ) : (
                    <span className="text-zinc-400">Unverified</span>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <UserActions userId={user.id} role={user.role} banned={!!user.banned} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string | null }) {
  if (role === "admin") {
    return (
      <span className="inline-flex items-center rounded bg-zinc-900 px-1.5 py-0.5 text-xs font-medium text-white">
        admin
      </span>
    );
  }
  return <span className="text-zinc-500">user</span>;
}
