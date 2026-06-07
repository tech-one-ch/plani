import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgMember } from "@/lib/require-session";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]).default("member"),
});

type Params = { params: Promise<{ orgId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { orgId } = await params;
  const { error, session, member } = await requireOrgMember(orgId);
  if (error || !session || !member)
    return error ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (member.role !== "admin" && member.role !== "owner")
    return NextResponse.json({ error: "Forbidden: admin role required" }, { status: 403 });

  const body = (await request.json()) as unknown;
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const baseUrl = process.env["APP_URL"] ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/auth/organization/invite-member`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") ?? "",
      },
      body: JSON.stringify({
        organizationId: orgId,
        email: parsed.data.email,
        role: parsed.data.role,
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to send invitation" }, { status: 500 });
  }
}
