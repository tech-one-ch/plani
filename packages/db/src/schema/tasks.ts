// packages/db/src/schema/tasks.ts
import { date, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { users } from "./auth";
import { projects } from "./projects";

export const tasks = pgTable("task", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["backlog", "todo", "in_progress", "done"] })
    .notNull()
    .default("backlog"),
  priority: text("priority", { enum: ["low", "medium", "high"] })
    .notNull()
    .default("medium"),
  dueDate: date("due_date"),
  assigneeId: text("assignee_id").references(() => users.id, { onDelete: "set null" }),
  position: real("position").notNull().default(1000),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});
