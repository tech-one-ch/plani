export const dynamic = "force-dynamic";

import { getDb, members, projects, tasks, users } from "@plani/db";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Board } from "./board";

interface PageProps {
  params: Promise<{ projectSlug: string }>;
  searchParams: Promise<{ task?: string }>;
}

export default async function ProjectPage({ params, searchParams }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const orgId = session.session.activeOrganizationId;
  if (!orgId) redirect("/dashboard");

  const { projectSlug } = await params;
  const { task: activeTaskId } = await searchParams;

  const db = getDb();

  // Fetch project, verify it belongs to the active org
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.slug, projectSlug), eq(projects.organizationId, orgId)));

  if (!project) notFound();

  // Fetch all tasks for this project
  const projectTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, project.id))
    .orderBy(tasks.status, tasks.position);

  // Fetch org members for the assignee picker (join with users for names)
  const orgMembers = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(members)
    .innerJoin(users, eq(members.userId, users.id))
    .where(eq(members.organizationId, orgId));

  // Pre-fetch active task if URL has ?task=
  const activeTask = activeTaskId
    ? (projectTasks.find((t) => t.id === activeTaskId) ?? null)
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: project.color ?? "#6366f1" }}
        />
        <h1 className="text-xl font-bold text-zinc-900">{project.name}</h1>
        {project.description && (
          <span className="text-sm text-zinc-400">{project.description}</span>
        )}
      </div>

      <Board
        project={project}
        initialTasks={projectTasks}
        members={orgMembers}
        initialActiveTask={activeTask}
      />
    </div>
  );
}
