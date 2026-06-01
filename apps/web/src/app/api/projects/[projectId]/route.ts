import { getDb, projects } from "@plani/db";
import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgMember } from "@/lib/require-org-member";

const updateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(500).nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullable()
    .optional(),
});

async function getProjectForOrg(projectId: string, orgId: string) {
  const db = getDb();
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.organizationId, orgId)));
  return project ?? null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const auth = await requireOrgMember();
  if (!auth.ok) return auth.response;

  const { projectId } = await params;
  const project = await getProjectForOrg(projectId, auth.orgId);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await request.json()) as unknown;
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();
  const [updated] = await db
    .update(projects)
    .set(parsed.data)
    .where(eq(projects.id, projectId))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const auth = await requireOrgMember();
  if (!auth.ok) return auth.response;

  const { projectId } = await params;
  const project = await getProjectForOrg(projectId, auth.orgId);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const db = getDb();
  await db.delete(projects).where(eq(projects.id, projectId));

  return NextResponse.json({ ok: true });
}
