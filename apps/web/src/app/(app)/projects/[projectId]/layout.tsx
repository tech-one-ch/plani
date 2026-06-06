export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getDb, projects, members } from "@plani/db";
import { and, eq } from "drizzle-orm";

const TABS = [
  { label: "Board", slug: "board", disabled: false },
  { label: "Tâches", slug: "tasks", disabled: false },
  { label: "Notes", slug: "notes", disabled: false },
  { label: "Calendrier", slug: "calendar", disabled: true },
] as const;

interface Props {
  children: ReactNode;
  params: Promise<{ projectId: string }>;
}

export default async function ProjectLayout({ children, params }: Props) {
  const { projectId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const db = getDb();
  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1)
    .then((r) => r[0]);

  if (!project) notFound();

  const member = await db
    .select()
    .from(members)
    .where(
      and(eq(members.organizationId, project.organizationId), eq(members.userId, session.user.id)),
    )
    .limit(1)
    .then((r) => r[0]);

  if (!member) notFound();

  return (
    <div className="flex h-full flex-col">
      <div
        className="flex h-11 flex-shrink-0 items-center gap-1 border-b px-6"
        style={{
          borderColor: "var(--color-border-subtle)",
          backgroundColor: "var(--color-bg-app)",
        }}
      >
        <span className="mr-4 text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
          {project.name}
        </span>
        {TABS.map((tab) =>
          tab.disabled ? (
            <span
              key={tab.slug}
              className="cursor-not-allowed px-3 py-2 text-xs"
              style={{ color: "var(--color-text-muted)" }}
              title="Disponible bientôt"
            >
              {tab.label}
            </span>
          ) : (
            <Link
              key={tab.slug}
              href={`/projects/${projectId}/${tab.slug}`}
              className="px-3 py-2 text-xs transition-colors"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {tab.label}
            </Link>
          ),
        )}
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
