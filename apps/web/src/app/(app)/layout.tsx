export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { getDb, projects } from "@plani/db";
import { eq } from "drizzle-orm";
import { Topbar } from "@/components/layout/topbar";
import { Sidebar } from "@/components/layout/sidebar";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const activeOrgId = session.session.activeOrganizationId;
  const db = getDb();

  let projectList: { id: string; name: string; color: string }[] = [];

  if (activeOrgId) {
    projectList = await db
      .select({ id: projects.id, name: projects.name, color: projects.color })
      .from(projects)
      .where(eq(projects.organizationId, activeOrgId))
      .orderBy(projects.createdAt);
  }

  return (
    <div
      className="flex h-screen flex-col"
      style={{ backgroundColor: "var(--color-bg-app)", color: "var(--color-text-primary)" }}
    >
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar projects={projectList} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
