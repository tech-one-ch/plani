import { auth } from "@/lib/auth";
import { getDb, members, organizations } from "@plani/db";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import Link from "next/link";
import { Settings, Shield } from "lucide-react";
import { OrgSwitcher } from "./org-switcher";

export async function Topbar() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const activeOrgId = session.session.activeOrganizationId ?? null;

  const db = getDb();
  const userOrgs = await db
    .select({ id: organizations.id, name: organizations.name })
    .from(members)
    .innerJoin(organizations, eq(organizations.id, members.organizationId))
    .where(eq(members.userId, session.user.id));

  const initials =
    (session.user.name ?? "?")
      .split(" ")
      .map((n: string) => n[0] ?? "")
      .filter(Boolean)
      .join("")
      .toUpperCase()
      .substring(0, 2) || "?";

  return (
    <header
      className="bg-bg-sidebar flex h-10 flex-shrink-0 items-center justify-between border-b px-4"
      style={{ borderColor: "var(--color-border-subtle)" }}
    >
      <div className="flex items-center gap-3">
        <Link
          href="/home"
          className="text-sm font-bold tracking-tight"
          style={{ color: "var(--color-text-white)" }}
        >
          plani
        </Link>
        <OrgSwitcher currentOrgId={activeOrgId} orgs={userOrgs} />
      </div>
      <div className="flex items-center gap-3">
        {session.user.role === "admin" && (
          <Link href="/admin" className="icon-hover" title="Instance admin">
            <Shield size={15} />
          </Link>
        )}
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
