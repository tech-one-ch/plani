export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getDb, tasks } from "@plani/db";
import { asc, eq } from "drizzle-orm";
import { TaskList } from "@/components/tasks/task-list";
import { requireProjectAccess } from "@/lib/require-session";

interface Props {
  params: Promise<{ projectId: string }>;
}

export default async function TasksPage({ params }: Props) {
  const { projectId } = await params;
  const { error } = await requireProjectAccess(projectId);
  if (error) notFound();

  const db = getDb();
  const taskList = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .orderBy(asc(tasks.status), asc(tasks.position));

  return <TaskList projectId={projectId} initialTasks={taskList} />;
}
