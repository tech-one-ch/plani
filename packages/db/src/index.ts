import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema/index";

export * from "./schema/index";

function createDb() {
  if (!process.env["DATABASE_URL"]) {
    throw new Error("DATABASE_URL is required");
  }
  const client = postgres(process.env["DATABASE_URL"]);
  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDb>;

export { createDb };
