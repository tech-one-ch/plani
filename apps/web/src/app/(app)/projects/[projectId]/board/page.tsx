export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDb, tasks } from "@plani/db";
import { asc, eq } from "drizzle-orm";
import { KanbanBoard } from "@/components/kanban/board";

interface Props {
  params: Promise<{ projectId: string }>;
}

export default async function BoardPage({ params }: Props) {
  const { projectId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const db = getDb();
  const taskList = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .orderBy(asc(tasks.position), asc(tasks.createdAt));

  return <KanbanBoard projectId={projectId} initialTasks={taskList} />;
}
