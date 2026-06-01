import { getDb, projects, tasks } from "@plani/db";
import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgMember } from "@/lib/require-org-member";

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  priority: z.enum(["low", "medium", "high"]).nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  position: z.number().int().min(0).optional(),
  // For DnD reorder: new ordered list of task IDs in the affected column(s)
  affectedIds: z.array(z.string()).optional(),
});

async function getTaskForOrg(taskId: string, orgId: string) {
  const db = getDb();
  const [result] = await db
    .select({ task: tasks, orgId: projects.organizationId })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(and(eq(tasks.id, taskId), eq(projects.organizationId, orgId)));
  return result?.task ?? null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const auth = await requireOrgMember();
  if (!auth.ok) return auth.response;

  const { taskId } = await params;
  const task = await getTaskForOrg(taskId, auth.orgId);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await request.json()) as unknown;
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();
  const { affectedIds, dueDate, ...rest } = parsed.data;

  // Build the update payload (exclude undefined values)
  const update: Partial<typeof tasks.$inferInsert> = { ...rest };
  if (dueDate !== undefined) {
    update.dueDate = dueDate ? new Date(dueDate) : null;
  }

  // Batch-update positions for DnD reorder in a transaction
  if (affectedIds && affectedIds.length > 0) {
    await db.transaction(async (tx) => {
      await tx.update(tasks).set(update).where(eq(tasks.id, taskId));
      for (const [index, id] of affectedIds.entries()) {
        await tx.update(tasks).set({ position: index }).where(eq(tasks.id, id));
      }
    });
    const [updated] = await db.select().from(tasks).where(eq(tasks.id, taskId));
    return NextResponse.json(updated);
  }

  const [updated] = await db.update(tasks).set(update).where(eq(tasks.id, taskId)).returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const auth = await requireOrgMember();
  if (!auth.ok) return auth.response;

  const { taskId } = await params;
  const task = await getTaskForOrg(taskId, auth.orgId);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const db = getDb();
  await db.delete(tasks).where(eq(tasks.id, taskId));

  return NextResponse.json({ ok: true });
}
