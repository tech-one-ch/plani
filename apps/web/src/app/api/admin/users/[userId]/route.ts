import { getDb, users } from "@plani/db";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";

const schema = z.object({
  action: z.enum(["ban", "unban", "promote", "demote"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { userId } = await params;
  const body = (await request.json()) as unknown;
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Prevent admins from acting on themselves
  if (userId === auth.userId && (parsed.data.action === "ban" || parsed.data.action === "demote")) {
    return NextResponse.json({ error: "Cannot modify your own account" }, { status: 400 });
  }

  const db = getDb();

  const updates: Partial<typeof users.$inferInsert> = {};
  switch (parsed.data.action) {
    case "ban":
      updates.banned = true;
      break;
    case "unban":
      updates.banned = false;
      break;
    case "promote":
      updates.role = "admin";
      break;
    case "demote":
      updates.role = "user";
      break;
  }

  await db.update(users).set(updates).where(eq(users.id, userId));

  return NextResponse.json({ ok: true });
}
