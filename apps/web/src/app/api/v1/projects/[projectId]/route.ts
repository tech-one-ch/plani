import { getDb, projects } from "@plani/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireProjectAccess } from "@/lib/require-session";
import { slugify } from "@/lib/slugify";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { projectId } = await params;
  const { error, project } = await requireProjectAccess(projectId);
  if (error || !project) return error ?? NextResponse.json({ error: "Not Found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { projectId } = await params;
  const { error } = await requireProjectAccess(projectId);
  if (error) return error;

  const body = (await request.json()) as unknown;
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();
  const updates: Record<string, unknown> = {};
  if (parsed.data.name) {
    updates["name"] = parsed.data.name;
    updates["slug"] = slugify(parsed.data.name);
  }
  if (parsed.data.color) updates["color"] = parsed.data.color;

  const updated = await db
    .update(projects)
    .set(updates)
    .where(eq(projects.id, projectId))
    .returning()
    .then((r) => r[0]);

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { projectId } = await params;
  const { error } = await requireProjectAccess(projectId);
  if (error) return error;

  const db = getDb();
  await db.delete(projects).where(eq(projects.id, projectId));
  return new Response(null, { status: 204 });
}
