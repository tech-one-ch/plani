// packages/db/src/schema/projects.ts
import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { workspaces } from "./workspaces";

export const projects = pgTable(
  "project",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    color: text("color").notNull().default("#3b82f6"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (t) => [uniqueIndex("project_workspace_slug_idx").on(t.workspaceId, t.slug)],
);
