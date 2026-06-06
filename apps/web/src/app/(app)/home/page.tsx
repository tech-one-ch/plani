export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDb, projects, tasks } from "@plani/db";
import { and, eq, ne } from "drizzle-orm";
import { HomeClient } from "./home-client";

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const activeOrgId = session.session.activeOrganizationId ?? null;

  if (!activeOrgId) {
    return <HomeClient orgId={null} projects={[]} assignedTasks={[]} />;
  }

  const db = getDb();

  const rawProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      color: projects.color,
      createdAt: projects.createdAt,
    })
    .from(projects)
    .where(eq(projects.organizationId, activeOrgId))
    .orderBy(projects.createdAt);

  const projectList = rawProjects.map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
    createdAtLabel: p.createdAt.toLocaleDateString("fr-CH", { day: "numeric", month: "short" }),
  }));

  const assignedTasks =
    projectList.length === 0
      ? []
      : await db
          .select({
            id: tasks.id,
            title: tasks.title,
            status: tasks.status,
            priority: tasks.priority,
            projectId: tasks.projectId,
            projectName: projects.name,
            projectColor: projects.color,
          })
          .from(tasks)
          .innerJoin(projects, eq(projects.id, tasks.projectId))
          .where(
            and(
              eq(tasks.assigneeId, session.user.id),
              ne(tasks.status, "done"),
              eq(projects.organizationId, activeOrgId),
            ),
          )
          .orderBy(tasks.createdAt);

  return <HomeClient orgId={activeOrgId} projects={projectList} assignedTasks={assignedTasks} />;
}
