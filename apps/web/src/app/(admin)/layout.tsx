import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold text-zinc-900">Plani</span>
            <span className="rounded bg-zinc-900 px-2 py-0.5 text-xs font-medium text-white">
              Admin
            </span>
          </div>
          <span className="text-sm text-zinc-500">{session.user.email}</span>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8">
        <nav className="w-48 shrink-0">
          <ul className="space-y-1 text-sm">
            <li>
              <a
                href="/admin"
                className="block rounded-md px-3 py-2 font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Overview
              </a>
            </li>
            <li>
              <a
                href="/admin/users"
                className="block rounded-md px-3 py-2 font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Users
              </a>
            </li>
            <li>
              <a
                href="/admin/settings"
                className="block rounded-md px-3 py-2 font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Settings
              </a>
            </li>
            <li className="border-t border-zinc-200 pt-4">
              <a
                href="/dashboard"
                className="block rounded-md px-3 py-2 text-zinc-500 hover:bg-zinc-100"
              >
                ← Back to app
              </a>
            </li>
          </ul>
        </nav>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
