import { getDb, tasks, projects, members } from "@plani/db";
import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/require-session";

const updateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["backlog", "todo", "in_progress", "done"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  due_date: z.string().date().nullable().optional(),
  assignee_id: z.string().nullable().optional(),
  position: z.number().optional(),
});

type Params = { params: Promise<{ taskId: string }> };

async function getTaskWithAccess(taskId: string, userId: string) {
  const db = getDb();
  const task = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1)
    .then((r) => r[0]);

  if (!task)
    return { task: null, error: NextResponse.json({ error: "Not Found" }, { status: 404 }) };

  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, task.projectId))
    .limit(1)
    .then((r) => r[0]);

  if (!project)
    return { task: null, error: NextResponse.json({ error: "Not Found" }, { status: 404 }) };

  const member = await db
    .select()
    .from(members)
    .where(and(eq(members.organizationId, project.organizationId), eq(members.userId, userId)))
    .limit(1)
    .then((r) => r[0]);

  if (!member)
    return { task: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { task, project, error: null };
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { taskId } = await params;
  const { error: sessionError, session } = await requireSession();
  if (sessionError || !session) return sessionError;

  const { task, error } = await getTaskWithAccess(taskId, session.user.id);
  if (error) return error;
  return NextResponse.json(task);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { taskId } = await params;
  const { error: sessionError, session } = await requireSession();
  if (sessionError || !session) return sessionError;

  const { task, project, error } = await getTaskWithAccess(taskId, session.user.id);
  if (error || !task) return error;

  const body = (await request.json()) as unknown;
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();

  if (parsed.data.assignee_id) {
    const [m] = await db
      .select({ id: members.id })
      .from(members)
      .where(
        and(
          eq(members.organizationId, project.organizationId),
          eq(members.userId, parsed.data.assignee_id),
        ),
      )
      .limit(1);
    if (!m)
      return NextResponse.json(
        { error: "Assignee is not a member of this organization" },
        { status: 400 },
      );
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updates["title"] = parsed.data.title;
  if (parsed.data.description !== undefined) updates["description"] = parsed.data.description;
  if (parsed.data.status !== undefined) updates["status"] = parsed.data.status;
  if (parsed.data.priority !== undefined) updates["priority"] = parsed.data.priority;
  if (parsed.data.due_date !== undefined) updates["dueDate"] = parsed.data.due_date;
  if (parsed.data.assignee_id !== undefined) updates["assigneeId"] = parsed.data.assignee_id;
  if (parsed.data.position !== undefined) updates["position"] = parsed.data.position;

  const updated = await db
    .update(tasks)
    .set(updates)
    .where(eq(tasks.id, taskId))
    .returning()
    .then((r) => r[0]);

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { taskId } = await params;
  const { error: sessionError, session } = await requireSession();
  if (sessionError || !session) return sessionError;

  const { task, error } = await getTaskWithAccess(taskId, session.user.id);
  if (error || !task) return error;

  const db = getDb();
  await db.delete(tasks).where(eq(tasks.id, taskId));
  return new Response(null, { status: 204 });
}
