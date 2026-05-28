import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";

export type Database = ReturnType<typeof createDb>;

export function createDb(databaseUrl: string) {
  const client = postgres(databaseUrl);
  return drizzle(client, { schema });
}

let _db: Database | undefined;

export function getDb(): Database {
  if (!_db) {
    // postgres.js connects lazily (on first query), so createDb with a placeholder
    // URL is safe during Next.js build-time module evaluation. The error surfaces
    // at request time when DATABASE_URL is actually missing.
    _db = createDb(process.env["DATABASE_URL"] ?? "postgres://localhost/plani");
  }
  return _db;
}
