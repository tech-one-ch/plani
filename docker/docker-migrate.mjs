/**
 * Startup migration runner for Docker.
 * Applies all pending SQL migrations before the app starts.
 *
 * Uses postgres.js directly (available in the standalone output) instead of
 * drizzle-orm (which is bundled by webpack and not present as a module in
 * the standalone node_modules).
 */
import postgres from "postgres";
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const url = process.env.DATABASE_URL;
if (!url) {
  console.warn("[migrate] DATABASE_URL not set — skipping migrations.");
  process.exit(0);
}

const sql = postgres(url, { max: 1 });

try {
  await sql`
    CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
      id         SERIAL PRIMARY KEY,
      hash       TEXT   NOT NULL UNIQUE,
      created_at BIGINT
    )
  `;

  const migrationsDir = join(__dirname, "migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const applied = await sql`SELECT hash FROM "__drizzle_migrations"`;
  const appliedSet = new Set(applied.map((r) => r.hash));

  let count = 0;
  for (const file of files) {
    if (appliedSet.has(file)) continue;

    console.log(`[migrate] Applying: ${file}`);
    const content = readFileSync(join(migrationsDir, file), "utf8");

    const statements = content
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      await sql.unsafe(stmt);
    }

    await sql`
      INSERT INTO "__drizzle_migrations" (hash, created_at)
      VALUES (${file}, ${Date.now()})
    `;
    count++;
  }

  if (count === 0) {
    console.log("[migrate] ✓ Already up to date.");
  } else {
    console.log(`[migrate] ✓ Applied ${count} migration(s).`);
  }
} catch (err) {
  console.error("[migrate] ✗ Failed:", err);
  process.exit(1);
} finally {
  await sql.end();
}
