import { integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { users } from "./auth";
import { organizations } from "./organizations";

/**
 * Project and task tables — core Plani business data.
 * IDs use uuid v7 (time-sortable, anti-collision).
 */

export const projects = pgTable(
  "project",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    // Hex color string e.g. "#6366f1" for visual distinction in the dashboard
    color: text("color"),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (t) => [uniqueIndex("project_org_slug_idx").on(t.organizationId, t.slug)],
);

export const tasks = pgTable("task", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  // Plain text enum — avoids costly Postgres ENUM migrations when adding values later
  status: text("status", { enum: ["todo", "in_progress", "done"] })
    .notNull()
    .default("todo"),
  // Nullable = no priority set
  priority: text("priority", { enum: ["low", "medium", "high"] }),
  assigneeId: text("assignee_id").references(() => users.id, { onDelete: "set null" }),
  dueDate: timestamp("due_date", { withTimezone: true }),
  // Integer position within a column; 0-based, ascending
  position: integer("position").notNull().default(0),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";
