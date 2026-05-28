import { getDb, instanceSettings, INSTANCE_SETTING_KEYS } from "@plani/db";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";

const schema = z.object({
  allow_signup: z.boolean().optional(),
});

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as unknown;
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const db = getDb();

  if (parsed.data.allow_signup !== undefined) {
    await db
      .insert(instanceSettings)
      .values({
        key: INSTANCE_SETTING_KEYS.ALLOW_SIGNUP,
        value: String(parsed.data.allow_signup),
      })
      .onConflictDoUpdate({
        target: instanceSettings.key,
        set: { value: String(parsed.data.allow_signup) },
      });
  }

  return NextResponse.json({ ok: true });
}
