// apps/web/src/app/(app)/dashboard/dashboard-client.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CreateProjectModal } from "@/components/project/create-project-modal";

type Project = { id: string; name: string; color: string; createdAt: Date };
type Workspace = { id: string; name: string };

export function DashboardClient({
  workspace,
  projects,
}: {
  workspace: Workspace;
  projects: Project[];
}) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold" style={{ color: "var(--color-text-white)" }}>
          Projets
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--color-accent)" }}
        >
          <Plus size={14} />
          Nouveau projet
        </button>
      </div>

      {projects.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center"
          style={{ borderColor: "var(--color-border-default)" }}
        >
          <p className="mb-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Aucun projet pour l'instant.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="text-sm"
            style={{ color: "var(--color-accent)" }}
          >
            Créer votre premier projet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}/board`}
              className="group rounded-lg border p-5 transition-colors"
              style={{
                borderColor: "var(--color-border-subtle)",
                backgroundColor: "var(--color-bg-elevated)",
              }}
            >
              <div className="mb-3 flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: project.color }} />
                <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                  {project.name}
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                Créé le{" "}
                {new Date(project.createdAt).toLocaleDateString("fr-CH", {
                  day: "numeric",
                  month: "short",
                })}
              </p>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <CreateProjectModal workspaceId={workspace.id} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
