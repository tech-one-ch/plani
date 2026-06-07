import { getDb, members, tasks } from "@plani/db";
import { and, asc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireProjectAccess } from "@/lib/require-session";

const createSchema = z.object({
  title: z.string().min(1).max(255),
  status: z.enum(["backlog", "todo", "in_progress", "done"]).default("backlog"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  description: z.string().optional(),
  due_date: z.string().date().optional().nullable(),
  assignee_id: z.string().optional().nullable(),
  position: z.number().default(1000),
});

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { projectId } = await params;
  const { error } = await requireProjectAccess(projectId);
  if (error) return error;

  const db = getDb();
  const list = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .orderBy(asc(tasks.position), asc(tasks.createdAt));

  return NextResponse.json(list);
}

export async function POST(request: NextRequest, { params }: Params) {
  const { projectId } = await params;
  const { error, project } = await requireProjectAccess(projectId);
  if (error) return error;

  const body = (await request.json()) as unknown;
  const parsed = createSchema.safeParse(body);
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

  const task = await db
    .insert(tasks)
    .values({
      projectId,
      title: parsed.data.title,
      status: parsed.data.status,
      priority: parsed.data.priority,
      description: parsed.data.description,
      dueDate: parsed.data.due_date ?? undefined,
      assigneeId: parsed.data.assignee_id ?? undefined,
      position: parsed.data.position,
    })
    .returning()
    .then((r) => r[0]);

  return NextResponse.json(task, { status: 201 });
}
