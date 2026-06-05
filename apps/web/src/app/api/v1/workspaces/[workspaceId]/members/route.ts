import { getDb, users, workspaceMembers } from "@plani/db";
import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspaceMember } from "@/lib/require-session";

type Params = { params: Promise<{ workspaceId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { workspaceId } = await params;
  const { error } = await requireWorkspaceMember(workspaceId);
  if (error) return error;

  const db = getDb();
  const members = await db
    .select({
      userId: workspaceMembers.userId,
      role: workspaceMembers.role,
      joinedAt: workspaceMembers.createdAt,
      name: users.name,
      email: users.email,
      image: users.image,
    })
    .from(workspaceMembers)
    .innerJoin(users, eq(users.id, workspaceMembers.userId))
    .where(eq(workspaceMembers.workspaceId, workspaceId));

  return NextResponse.json(members);
}

const removeSchema = z.object({ userId: z.string() });

export async function DELETE(request: NextRequest, { params }: Params) {
  const { workspaceId } = await params;
  const { error, session } = await requireWorkspaceMember(workspaceId);
  if (error || !session)
    return error ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as unknown;
  const parsed = removeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  if (parsed.data.userId === session.user.id) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
  }

  const db = getDb();
  await db
    .delete(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, parsed.data.userId),
      ),
    );

  return new Response(null, { status: 204 });
}
