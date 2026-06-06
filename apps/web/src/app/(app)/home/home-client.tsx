"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, FolderOpen, CheckSquare } from "lucide-react";
import { CreateProjectModal } from "@/components/project/create-project-modal";
import { CreateOrgModal } from "./create-org-modal";

type Project = { id: string; name: string; color: string; createdAtLabel: string };
type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  projectId: string;
  projectName: string;
  projectColor: string;
};

interface HomeClientProps {
  orgId: string | null;
  projects: Project[];
  assignedTasks: Task[];
}

const PRIORITY_COLOR: Record<string, string> = {
  high: "var(--color-priority-high)",
  medium: "var(--color-priority-medium)",
  low: "var(--color-priority-low)",
};

const STATUS_LABEL: Record<string, string> = {
  backlog: "Backlog",
  todo: "À faire",
  in_progress: "En cours",
  done: "Terminé",
};

export function HomeClient({ orgId, projects, assignedTasks }: HomeClientProps) {
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);

  if (!orgId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: "var(--color-bg-elevated)" }}
        >
          <FolderOpen size={22} style={{ color: "var(--color-text-muted)" }} />
        </div>
        <div>
          <p className="mb-1 font-medium" style={{ color: "var(--color-text-primary)" }}>
            Aucune organisation
          </p>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Créez une organisation pour commencer à planifier.
          </p>
        </div>
        <button
          onClick={() => setShowOrgModal(true)}
          className="rounded-md px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--color-accent)" }}
        >
          Créer une organisation
        </button>
        {showOrgModal && <CreateOrgModal onClose={() => setShowOrgModal(false)} />}
      </div>
    );
  }

  const openTasks = assignedTasks.filter((t) => t.status !== "done");

  return (
    <div className="p-8">
      <h1 className="mb-8 text-xl font-semibold" style={{ color: "var(--color-text-white)" }}>
        Home
      </h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* My tasks */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <CheckSquare size={14} />
              Mes tâches
              {openTasks.length > 0 && (
                <span
                  className="rounded px-1.5 py-0.5 text-xs"
                  style={{
                    backgroundColor: "var(--color-bg-elevated)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {openTasks.length}
                </span>
              )}
            </h2>
          </div>

          {openTasks.length === 0 ? (
            <div
              className="rounded-lg border border-dashed py-10 text-center"
              style={{ borderColor: "var(--color-border-default)" }}
            >
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                Aucune tâche assignée.
              </p>
            </div>
          ) : (
            <div
              className="overflow-hidden rounded-lg border"
              style={{ borderColor: "var(--color-border-subtle)" }}
            >
              {openTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/projects/${task.projectId}/board`}
                  className="flex items-center gap-3 border-b px-4 py-3 transition-colors last:border-0"
                  style={{
                    borderColor: "var(--color-border-subtle)",
                    backgroundColor: "var(--color-bg-elevated)",
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: PRIORITY_COLOR[task.priority] }}
                  />
                  <span
                    className="flex-1 truncate text-xs"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {task.title}
                  </span>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <span
                      className="flex items-center gap-1 text-[10px]"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-sm"
                        style={{ backgroundColor: task.projectColor }}
                      />
                      {task.projectName}
                    </span>
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px]"
                      style={{
                        backgroundColor: "var(--color-bg-app)",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {STATUS_LABEL[task.status] ?? task.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Projects */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <FolderOpen size={14} />
              Projets
            </h2>
            <button
              onClick={() => setShowProjectModal(true)}
              className="flex items-center gap-1 text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              <Plus size={12} />
              Nouveau
            </button>
          </div>

          {projects.length === 0 ? (
            <div
              className="rounded-lg border border-dashed py-10 text-center"
              style={{ borderColor: "var(--color-border-default)" }}
            >
              <p className="mb-3 text-sm" style={{ color: "var(--color-text-muted)" }}>
                Aucun projet pour l&apos;instant.
              </p>
              <button
                onClick={() => setShowProjectModal(true)}
                className="text-sm"
                style={{ color: "var(--color-accent)" }}
              >
                Créer votre premier projet
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}/board`}
                  className="flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors"
                  style={{
                    borderColor: "var(--color-border-subtle)",
                    backgroundColor: "var(--color-bg-elevated)",
                  }}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="flex-1 text-sm" style={{ color: "var(--color-text-primary)" }}>
                    {project.name}
                  </span>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {project.createdAtLabel}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {showProjectModal && <CreateProjectModal onClose={() => setShowProjectModal(false)} />}
    </div>
  );
}
