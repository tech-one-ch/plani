import { getDb, users, members } from "@plani/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgMember } from "@/lib/require-session";

type Params = { params: Promise<{ orgId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { orgId } = await params;
  const { error } = await requireOrgMember(orgId);
  if (error) return error;

  const db = getDb();
  const list = await db
    .select({
      userId: members.userId,
      role: members.role,
      joinedAt: members.createdAt,
      name: users.name,
      email: users.email,
      image: users.image,
    })
    .from(members)
    .innerJoin(users, eq(users.id, members.userId))
    .where(eq(members.organizationId, orgId));

  return NextResponse.json(list);
}

const removeSchema = z.object({ userId: z.string() });

export async function DELETE(request: NextRequest, { params }: Params) {
  const { orgId } = await params;
  const { error, session, member } = await requireOrgMember(orgId);
  if (error || !session || !member)
    return error ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (member.role !== "admin" && member.role !== "owner")
    return NextResponse.json({ error: "Forbidden: admin role required" }, { status: 403 });

  const body = (await request.json()) as unknown;
  const parsed = removeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  if (parsed.data.userId === session.user.id)
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });

  const baseUrl = process.env["APP_URL"] ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/auth/organization/remove-member`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: request.headers.get("cookie") ?? "",
    },
    body: JSON.stringify({ memberIdOrEmail: parsed.data.userId, organizationId: orgId }),
  });

  if (!res.ok) return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  return new Response(null, { status: 204 });
}
