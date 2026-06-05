// apps/web/src/app/(app)/dashboard/page.tsx
export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDb, workspaces, projects } from "@plani/db";
import { eq } from "drizzle-orm";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
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

  const projectList = await db
    .select()
    .from(projects)
    .where(eq(projects.workspaceId, workspace.id))
    .orderBy(projects.createdAt);

  return <DashboardClient workspace={workspace} projects={projectList} />;
}
