import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Instance-level configuration — global settings for this Plani deployment.
 * Stored as a key-value table so new settings can be added without schema migrations.
 */

export const instanceSettings = pgTable("instance_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

// Typed keys for instance settings
export const INSTANCE_SETTING_KEYS = {
  ALLOW_SIGNUP: "allow_signup",
  DEFAULT_ORG_ROLE: "default_org_role",
  SETUP_COMPLETED: "setup_completed",
} as const;

export type InstanceSettingKey = (typeof INSTANCE_SETTING_KEYS)[keyof typeof INSTANCE_SETTING_KEYS];
