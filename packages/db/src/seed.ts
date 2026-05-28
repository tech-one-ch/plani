/**
 * Dev seed — populates default instance settings.
 * Run with: pnpm --filter @plani/db db:seed
 * Only for local development — never run against production.
 */
import "dotenv/config";
import { INSTANCE_SETTING_KEYS } from "./schema/instance";
import { getDb } from "./client";
import { instanceSettings } from "./schema/index";

async function seed() {
  if (process.env["NODE_ENV"] === "production") {
    throw new Error("Seed must not run in production");
  }

  const db = getDb();

  console.log("Seeding instance settings...");
  await db
    .insert(instanceSettings)
    .values([
      { key: INSTANCE_SETTING_KEYS.ALLOW_SIGNUP, value: "true" },
      { key: INSTANCE_SETTING_KEYS.DEFAULT_ORG_ROLE, value: "member" },
    ])
    .onConflictDoNothing();

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
