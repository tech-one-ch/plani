import { getDb, instanceSettings, INSTANCE_SETTING_KEYS, users } from "@plani/db";
import { NextResponse } from "next/server";

export async function POST() {
  const db = getDb();

  // Safety: only allow when there is at least one user (the one just created)
  const [firstUser] = await db.select({ id: users.id }).from(users).limit(1);
  if (!firstUser) {
    return NextResponse.json({ error: "No users found" }, { status: 400 });
  }

  const defaults = [
    { key: INSTANCE_SETTING_KEYS.SETUP_COMPLETED, value: "true" },
    { key: INSTANCE_SETTING_KEYS.ALLOW_SIGNUP, value: "true" },
  ];

  for (const row of defaults) {
    await db
      .insert(instanceSettings)
      .values(row)
      .onConflictDoUpdate({
        target: instanceSettings.key,
        set: { value: row.value },
      });
  }

  return NextResponse.json({ ok: true });
}
