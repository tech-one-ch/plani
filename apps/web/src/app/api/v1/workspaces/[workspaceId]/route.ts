// apps/web/src/app/api/v1/workspaces/[workspaceId]/route.ts
import { getDb, workspaces } from "@plani/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspaceMember } from "@/lib/require-session";
import { slugify } from "@/lib/slugify";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

type Params = { params: Promise<{ workspaceId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { workspaceId } = await params;
  const { error } = await requireWorkspaceMember(workspaceId);
  if (error) return error;

  const db = getDb();
  const workspace = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1)
    .then((r) => r[0]);

  if (!workspace) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  return NextResponse.json(workspace);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { workspaceId } = await params;
  const { error, member } = await requireWorkspaceMember(workspaceId);
  if (error) return error;
  if (!member || member.role !== "admin")
    return NextResponse.json({ error: "Forbidden: admin role required" }, { status: 403 });

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

  const updated = await db
    .update(workspaces)
    .set(updates)
    .where(eq(workspaces.id, workspaceId))
    .returning()
    .then((r) => r[0]);

  return NextResponse.json(updated);
}
