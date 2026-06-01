export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { OrgSwitcher } from "./org-switcher";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });

  if (!session) {
    redirect("/login");
  }

  const activeOrgId = session.session.activeOrganizationId ?? null;

  // Fetch orgs the user belongs to for the switcher
  let orgs: { id: string; name: string }[] = [];
  let activeOrgName: string | null = null;
  try {
    const result = await auth.api.listOrganizations({ headers: h });
    if (Array.isArray(result)) {
      orgs = result.map((o) => ({ id: o.id, name: o.name }));
      activeOrgName = orgs.find((o) => o.id === activeOrgId)?.name ?? null;
    }
  } catch {
    // org list unavailable — switcher will be empty, not a blocker
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-lg font-bold text-zinc-900">
              Plani
            </Link>
            <OrgSwitcher orgs={orgs} activeOrgId={activeOrgId} activeOrgName={activeOrgName} />
          </div>
          <div className="flex items-center gap-4">
            {session.user.role === "admin" && (
              <Link href="/admin" className="text-xs text-zinc-400 hover:text-zinc-700">
                Admin panel
              </Link>
            )}
            <span className="text-sm text-zinc-500">{session.user.name}</span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
