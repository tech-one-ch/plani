import { getDb, instanceSettings, INSTANCE_SETTING_KEYS } from "@plani/db";
import { eq } from "drizzle-orm";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const db = getDb();

  const [allowSignupRow] = await db
    .select()
    .from(instanceSettings)
    .where(eq(instanceSettings.key, INSTANCE_SETTING_KEYS.ALLOW_SIGNUP));

  const allowSignup = allowSignupRow?.value !== "false";
  const requireEmailVerification = process.env["REQUIRE_EMAIL_VERIFICATION"] === "true";
  const smtpConfigured =
    !!process.env["SMTP_HOST"] &&
    process.env["SMTP_HOST"] !== "localhost" &&
    !!process.env["SMTP_USER"];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">Instance settings</h1>

      <div className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6">
        <SettingsForm allowSignup={allowSignup} />

        <div className="space-y-3 border-t border-zinc-100 pt-6">
          <h2 className="text-sm font-semibold text-zinc-700">Email configuration</h2>
          <InfoRow
            label="SMTP configured"
            value={smtpConfigured ? "Yes" : "No — emails are disabled"}
            ok={smtpConfigured}
          />
          <InfoRow
            label="Email verification required"
            value={
              !smtpConfigured
                ? "Disabled (SMTP not configured)"
                : requireEmailVerification
                  ? "Yes"
                  : "No (set REQUIRE_EMAIL_VERIFICATION=true to enable)"
            }
            ok={smtpConfigured && requireEmailVerification}
          />
          <p className="text-xs text-zinc-400">
            Email settings are controlled via environment variables. Edit your <code>.env</code>{" "}
            file and restart the server to apply changes.
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-zinc-600">{label}</span>
      <span className={ok ? "font-medium text-green-600" : "text-zinc-400"}>{value}</span>
    </div>
  );
}
