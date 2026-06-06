import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { Settings } from "lucide-react";

export async function Topbar() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const activeOrgId = session.session.activeOrganizationId;
  let orgName: string | null = null;
  if (activeOrgId) {
    const org = await auth.api.getFullOrganization({
      headers: await headers(),
      query: { organizationId: activeOrgId },
    });
    orgName = org?.name ?? null;
  }

  const initials = session.user.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  return (
    <header
      className="bg-bg-sidebar flex h-10 flex-shrink-0 items-center justify-between border-b px-4"
      style={{ borderColor: "var(--color-border-subtle)" }}
    >
      <div className="flex items-center gap-3">
        <Link
          href="/home"
          className="text-sm font-bold tracking-tight"
          style={{ color: "var(--color-text-white)" }}
        >
          plani
        </Link>
        {orgName && (
          <span
            className="rounded border px-2 py-0.5 text-xs"
            style={{
              borderColor: "var(--color-border-default)",
              backgroundColor: "var(--color-bg-elevated)",
              color: "var(--color-text-secondary)",
            }}
          >
            {orgName}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Link href="/settings" className="icon-hover">
          <Settings size={15} />
        </Link>
        <div
          className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
          style={{ backgroundColor: "var(--color-accent-subtle)", color: "var(--color-accent)" }}
          title={session.user.name}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
