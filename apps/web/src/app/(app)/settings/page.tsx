export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getDb, workspaces } from "@plani/db";
import { eq } from "drizzle-orm";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const activeOrgId = session.session.activeOrganizationId;
  if (!activeOrgId) redirect("/workspace/new");

  const db = getDb();
  const workspace = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.organizationId, activeOrgId))
    .limit(1)
    .then((r) => r[0]);

  if (!workspace) redirect("/workspace/new");

  return (
    <div className="max-w-2xl p-8">
      <h1 className="mb-6 text-xl font-semibold" style={{ color: "var(--color-text-white)" }}>
        Paramètres du workspace
      </h1>

      <div
        className="mb-6 rounded-lg border p-5"
        style={{
          borderColor: "var(--color-border-subtle)",
          backgroundColor: "var(--color-bg-elevated)",
        }}
      >
        <h2 className="mb-4 text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
          Informations générales
        </h2>
        <div className="flex flex-col gap-3">
          <div>
            <p className="mb-0.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>
              Nom
            </p>
            <p className="text-sm" style={{ color: "var(--color-text-primary)" }}>
              {workspace.name}
            </p>
          </div>
          <div>
            <p className="mb-0.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>
              Slug
            </p>
            <p className="font-mono text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {workspace.slug}
            </p>
          </div>
        </div>
      </div>

      <div
        className="rounded-lg border p-5"
        style={{
          borderColor: "var(--color-border-subtle)",
          backgroundColor: "var(--color-bg-elevated)",
        }}
      >
        <h2 className="mb-3 text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
          Membres
        </h2>
        <Link href="/settings/members" className="text-sm" style={{ color: "var(--color-accent)" }}>
          Gérer les membres →
        </Link>
      </div>
    </div>
  );
}
