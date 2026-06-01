export const dynamic = "force-dynamic";

import { getDb, projects } from "@plani/db";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CreateProjectButton } from "./create-project-button";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const orgId = session.session.activeOrganizationId;

  // No active org — prompt to create one via the org switcher
  if (!orgId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h1 className="text-2xl font-bold text-zinc-900">Welcome to Plani</h1>
        <p className="mt-2 text-zinc-500">You need an organization to get started.</p>
        <p className="mt-4 text-sm text-zinc-400">
          Use the organization switcher in the header to create or select an organization.
        </p>
      </div>
    );
  }

  const db = getDb();
  const orgProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.organizationId, orgId))
    .orderBy(projects.createdAt);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Projects</h1>
        <CreateProjectButton />
      </div>

      {orgProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 py-16 text-center">
          <p className="text-zinc-500">No projects yet.</p>
          <p className="mt-1 text-sm text-zinc-400">Create your first project to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orgProjects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.slug}`}
              className="group rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <div
                  className="mt-0.5 h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: project.color ?? "#6366f1" }}
                />
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-zinc-900 group-hover:text-indigo-600">
                    {project.name}
                  </h2>
                  {project.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{project.description}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
