import { getDb, instanceSettings, INSTANCE_SETTING_KEYS, users } from "@plani/db";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { SetupForm } from "./setup-form";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const db = getDb();

  const [setupRow] = await db
    .select()
    .from(instanceSettings)
    .where(eq(instanceSettings.key, INSTANCE_SETTING_KEYS.SETUP_COMPLETED));

  if (setupRow?.value === "true") {
    redirect("/login");
  }

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
      className="flex min-h-screen flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: "var(--color-bg-app)" }}
    >
      <div className="w-full max-w-md space-y-8">
        {/* Brand */}
        <div className="text-center">
          <div
            className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold"
            style={{
              backgroundColor: "var(--color-accent-subtle)",
              color: "var(--color-accent)",
            }}
          >
            P
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-white)" }}>
            Welcome to Plani
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Create your admin account to get started.
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border p-8"
          style={{
            backgroundColor: "var(--color-bg-elevated)",
            borderColor: "var(--color-border-default)",
          }}
        >
          <div className="mb-6">
            <h2 className="text-base font-semibold" style={{ color: "var(--color-text-white)" }}>
              Admin account
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              This will be the owner of this Plani instance.
            </p>
          </div>

          <SetupForm />
        </div>

        {/* Footer */}
        <p className="text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
          Self-hosted · Open source ·{" "}
          <a
            href="https://github.com/tech-one-ch/plani"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            style={{ color: "var(--color-text-secondary)" }}
          >
            GitHub
          </a>
        </p>
      </div>
    </div>
  );
}
