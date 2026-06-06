import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { requireWorkspaceMember } from "@/lib/require-session";
import { getDb, workspaces } from "@plani/db";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]).default("member"),
});

type Params = { params: Promise<{ workspaceId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { workspaceId } = await params;
  const { error, session, member } = await requireWorkspaceMember(workspaceId);
  if (error || !session || !member)
    return error ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (member.role !== "admin")
    return NextResponse.json({ error: "Forbidden: admin role required" }, { status: 403 });

  const body = (await request.json()) as unknown;
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const db = getDb();
  const workspace = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1)
    .then((r) => r[0]);

  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  try {
    // Call the better-auth organization invite endpoint
    const baseUrl = process.env["APP_URL"] ?? "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/auth/organization/invite-member`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") || "",
      },
      body: JSON.stringify({
        organizationId: workspace.organizationId,
        email: parsed.data.email,
        role: parsed.data.role,
      }),
    });

    if (!response.ok) {
      const errorBody: unknown = await response.json();
      console.error("[invite] error:", errorBody);
      return NextResponse.json({ error: "Failed to send invitation" }, { status: response.status });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[invite] error:", err);
    return NextResponse.json({ error: "Failed to send invitation" }, { status: 500 });
  }
}
