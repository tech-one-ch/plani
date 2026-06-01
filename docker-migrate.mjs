/**
 * Startup migration runner for Docker.
 * Runs all pending Drizzle migrations before the app starts.
 *
 * Uses the drizzle-orm migrator directly — no drizzle-kit needed at runtime.
 * Called by docker-entrypoint.sh.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const url = process.env.DATABASE_URL;
if (!url) {
  console.warn("[migrate] DATABASE_URL is not set — skipping migrations.");
  process.exit(0);
}

console.log("[migrate] Running database migrations...");

const client = postgres(url, { max: 1 });
const db = drizzle(client);

try {
  await migrate(db, {
    migrationsFolder: join(__dirname, "migrations"),
  });
  console.log("[migrate] ✓ Migrations applied successfully.");
} catch (err) {
  console.error("[migrate] ✗ Migration failed:", err);
  process.exit(1);
} finally {
  await client.end();
}
