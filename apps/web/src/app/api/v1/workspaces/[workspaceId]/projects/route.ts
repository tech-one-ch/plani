import { getDb, projects } from "@plani/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspaceMember } from "@/lib/require-session";
import { slugify } from "@/lib/slugify";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#3b82f6"),
});

type Params = { params: Promise<{ workspaceId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { workspaceId } = await params;
  const { error } = await requireWorkspaceMember(workspaceId);
  if (error) return error;

  const db = getDb();
  const list = await db
    .select()
    .from(projects)
    .where(eq(projects.workspaceId, workspaceId))
    .orderBy(projects.createdAt);

  return NextResponse.json(list);
}

export async function POST(request: NextRequest, { params }: Params) {
  const { workspaceId } = await params;
  const { error } = await requireWorkspaceMember(workspaceId);
  if (error) return error;

  const body = (await request.json()) as unknown;
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();
  const project = await db
    .insert(projects)
    .values({
      workspaceId,
      name: parsed.data.name,
      slug: slugify(parsed.data.name),
      color: parsed.data.color,
    })
    .returning()
    .then((r) => r[0]);

  return NextResponse.json(project, { status: 201 });
}
