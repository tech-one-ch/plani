import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getDb, workspaces, workspaceMembers } from "@plani/db";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Settings } from "lucide-react";

export async function Topbar() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const db = getDb();

  const userWorkspaces = await db
    .select({ id: workspaces.id, name: workspaces.name })
    .from(workspaces)
    .innerJoin(workspaceMembers, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(eq(workspaceMembers.userId, session.user.id));

  const activeWorkspace = userWorkspaces[0];

  const initials = session.user.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  return (
    <header
      className="bg-bg-sidebar flex h-10 flex-shrink-0 items-center justify-between border-b px-4"
      style={{ borderColor: "var(--color-border-subtle)" }}
    >
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="text-sm font-bold tracking-tight"
          style={{ color: "var(--color-text-white)" }}
        >
          plani
        </Link>
        {activeWorkspace && (
          <span
            className="rounded border px-2 py-0.5 text-xs"
            style={{
              borderColor: "var(--color-border-default)",
              backgroundColor: "var(--color-bg-elevated)",
              color: "var(--color-text-secondary)",
            }}
          >
            {activeWorkspace.name}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Link href="/settings" className="icon-hover">
          <Settings size={15} />
        </Link>
        <div
          className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
          style={{ backgroundColor: "var(--color-accent-subtle)", color: "var(--color-accent)" }}
          title={session.user.name}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
