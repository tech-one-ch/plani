// Re-export the client factory for use in server/app code.
// The full auth instance is created in apps/web/src/lib/auth.ts
// to keep the DB connection and email sending co-located.
export { createAuthClient } from "./client";
export type { AuthClient } from "./client";
