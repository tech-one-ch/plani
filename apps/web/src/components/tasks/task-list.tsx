"use client";

import { useState } from "react";
import { TaskDetailPanel } from "./task-detail-panel";

type Task = {
  id: string;
  title: string;
  priority: "low" | "medium" | "high";
  dueDate: string | null;
  status: "backlog" | "todo" | "in_progress" | "done";
  position: number;
  description: string | null;
  assigneeId: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  backlog: "Backlog",
  todo: "À faire",
  in_progress: "En cours",
  done: "Terminé",
};
const PRIORITY_LABEL: Record<string, string> = { low: "Basse", medium: "Moyenne", high: "Haute" };
const PRIORITY_COLOR: Record<string, string> = {
  high: "var(--color-priority-high)",
  medium: "var(--color-priority-medium)",
  low: "var(--color-priority-low)",
};

export function TaskList({ projectId, initialTasks }: { projectId: string; initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [selected, setSelected] = useState<Task | null>(null);

  return (
    <>
      <div className="p-6">
        <div
          className="overflow-hidden rounded-lg border"
          style={{ borderColor: "var(--color-border-subtle)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                className="border-b"
                style={{
                  borderColor: "var(--color-border-subtle)",
                  backgroundColor: "var(--color-bg-elevated)",
                }}
              >
                <th
                  className="px-4 py-2.5 text-left text-xs font-medium"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Titre
                </th>
                <th
                  className="px-4 py-2.5 text-left text-xs font-medium"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Statut
                </th>
                <th
                  className="px-4 py-2.5 text-left text-xs font-medium"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Priorité
                </th>
                <th
                  className="px-4 py-2.5 text-left text-xs font-medium"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Échéance
                </th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => setSelected(task)}
                  className="cursor-pointer border-b transition-colors"
                  style={{
                    borderColor: "var(--color-border-subtle)",
                    backgroundColor: "var(--color-bg-app)",
                  }}
                >
                  <td
                    className="px-4 py-2.5 text-xs"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {task.title}
                  </td>
                  <td
                    className="px-4 py-2.5 text-xs"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {STATUS_LABEL[task.status]}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className="flex items-center gap-1.5 text-xs"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: PRIORITY_COLOR[task.priority] }}
                      />
                      {PRIORITY_LABEL[task.priority]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString("fr-CH", {
                          day: "numeric",
                          month: "short",
                        })
                      : "—"}
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Aucune tâche pour l'instant. Créez-en une depuis le Board.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <TaskDetailPanel
          task={selected}
          onClose={() => setSelected(null)}
          onUpdate={(updated) => {
            setTasks((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
            setSelected(updated);
          }}
          onDelete={(id) => setTasks((prev) => prev.filter((t) => t.id !== id))}
        />
      )}
    </>
  );
}
