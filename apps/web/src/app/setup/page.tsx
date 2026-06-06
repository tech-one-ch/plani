import { getDb, instanceSettings, INSTANCE_SETTING_KEYS, users } from "@plani/db";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { SetupForm } from "./setup-form";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const db = getDb();

  // If setup is already complete, redirect to login
  const [setupRow] = await db
    .select()
    .from(instanceSettings)
    .where(eq(instanceSettings.key, INSTANCE_SETTING_KEYS.SETUP_COMPLETED));

  if (setupRow?.value === "true") {
    redirect("/login");
  }

  // Double-check: if users already exist, mark as done and redirect
  const [existingUser] = await db.select({ id: users.id }).from(users).limit(1);
  if (existingUser) {
    await db
      .insert(instanceSettings)
      .values({ key: INSTANCE_SETTING_KEYS.SETUP_COMPLETED, value: "true" })
      .onConflictDoUpdate({
        target: instanceSettings.key,
        set: { value: "true" },
      });
    redirect("/login");
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{ backgroundColor: "var(--color-bg-app)" }}
    >
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold" style={{ color: "var(--color-text-white)" }}>
            Welcome to Plani
          </h1>
          <p className="mt-2" style={{ color: "var(--color-text-secondary)" }}>
            Create the admin account for this instance to get started.
          </p>
        </div>

        <div
          className="rounded-xl border p-8"
          style={{
            backgroundColor: "var(--color-bg-elevated)",
            borderColor: "var(--color-border-default)",
          }}
        >
          <h2 className="mb-1 text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Admin account
          </h2>
          <p className="mb-6 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            This account will be the owner of this Plani instance. You can add more administrators
            later from the admin panel.
          </p>
          <SetupForm />
        </div>
      </div>
    </div>
  );
}
