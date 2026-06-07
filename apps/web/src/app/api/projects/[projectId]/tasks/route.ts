import { getDb, members, projects, tasks } from "@plani/db";
import { and, count, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgMember } from "@/lib/require-org-member";

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  status: z.enum(["todo", "in_progress", "done"]).default("todo"),
  priority: z.enum(["low", "medium", "high"]).optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});

async function getProjectForOrg(projectId: string, orgId: string) {
  const db = getDb();
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.organizationId, orgId)));
  return project ?? null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const auth = await requireOrgMember();
  if (!auth.ok) return auth.response;

  const { projectId } = await params;
  const project = await getProjectForOrg(projectId, auth.orgId);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const db = getDb();
  const projectTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .orderBy(tasks.status, tasks.position);

  return NextResponse.json(projectTasks);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const auth = await requireOrgMember();
  if (!auth.ok) return auth.response;

  const { projectId } = await params;
  const project = await getProjectForOrg(projectId, auth.orgId);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await request.json()) as unknown;
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();

  if (parsed.data.assigneeId) {
    const [m] = await db
      .select({ id: members.id })
      .from(members)
      .where(
        and(eq(members.organizationId, auth.orgId), eq(members.userId, parsed.data.assigneeId)),
      );
    if (!m)
      return NextResponse.json(
        { error: "Assignee is not a member of this organization" },
        { status: 400 },
      );
  }

  // Position = number of existing tasks in this column
  const [countRow] = await db
    .select({ total: count() })
    .from(tasks)
    .where(and(eq(tasks.projectId, projectId), eq(tasks.status, parsed.data.status)));

  const position = Number(countRow?.total ?? 0);

  const [task] = await db
    .insert(tasks)
    .values({
      projectId,
      title: parsed.data.title,
      description: parsed.data.description,
      status: parsed.data.status,
      priority: parsed.data.priority,
      assigneeId: parsed.data.assigneeId,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      position,
      createdBy: auth.userId,
    })
    .returning();

  return NextResponse.json(task, { status: 201 });
}
