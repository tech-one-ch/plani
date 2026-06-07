"use client";

import { useEffect, useState } from "react";
import { X, Trash2 } from "lucide-react";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: "backlog" | "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  dueDate: string | null;
  assigneeId: string | null;
  position: number;
};

const STATUS_LABELS = {
  backlog: "Backlog",
  todo: "À faire",
  in_progress: "En cours",
  done: "Terminé",
};
const PRIORITY_LABELS = { low: "Basse", medium: "Moyenne", high: "Haute" };

interface Props {
  task: Task;
  onClose: () => void;
  onUpdate: (updated: Task) => void;
  onDelete: (id: string) => void;
}

export function TaskDetailPanel({ task, onClose, onUpdate, onDelete }: Props) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate ?? "");

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function save(updates: Partial<Task>) {
    try {
      const res = await fetch(`/api/v1/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error();
      const updated = (await res.json()) as Task;
      onUpdate(updated);
    } catch {
      // silently fail for now — panel still shows local state
    }
  }

  async function handleDelete() {
    if (!confirm("Supprimer cette tâche ?")) return;
    await fetch(`/api/v1/tasks/${task.id}`, { method: "DELETE" });
    onDelete(task.id);
    onClose();
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
      />
      <div
        className="fixed top-0 right-0 z-50 flex h-full w-96 flex-col border-l"
        style={{
          borderColor: "var(--color-border-subtle)",
          backgroundColor: "var(--color-bg-elevated)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-5 py-3"
          style={{ borderColor: "var(--color-border-subtle)" }}
        >
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Détail de la tâche
          </span>
          <button onClick={onClose} style={{ color: "var(--color-text-muted)" }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              if (title !== task.title) void save({ title });
            }}
            className="mb-4 w-full bg-transparent text-base font-medium focus:outline-none"
            style={{ color: "var(--color-text-white)" }}
            placeholder="Titre de la tâche"
          />

          {/* Meta fields */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="w-20 text-xs" style={{ color: "var(--color-text-muted)" }}>
                Statut
              </span>
              <select
                value={status}
                onChange={(e) => {
                  const val = e.target.value as Task["status"];
                  setStatus(val);
                  void save({ status: val });
                }}
                className="rounded border px-2 py-1 text-xs focus:outline-none"
                style={{
                  borderColor: "var(--color-border-default)",
                  backgroundColor: "var(--color-bg-app)",
                  color: "var(--color-text-primary)",
                }}
              >
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-20 text-xs" style={{ color: "var(--color-text-muted)" }}>
                Priorité
              </span>
              <select
                value={priority}
                onChange={(e) => {
                  const val = e.target.value as Task["priority"];
                  setPriority(val);
                  void save({ priority: val });
                }}
                className="rounded border px-2 py-1 text-xs focus:outline-none"
                style={{
                  borderColor: "var(--color-border-default)",
                  backgroundColor: "var(--color-bg-app)",
                  color: "var(--color-text-primary)",
                }}
              >
                {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-20 text-xs" style={{ color: "var(--color-text-muted)" }}>
                Échéance
              </span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  void save({ dueDate: e.target.value || null });
                }}
                className="rounded border px-2 py-1 text-xs focus:outline-none"
                style={{
                  borderColor: "var(--color-border-default)",
                  backgroundColor: "var(--color-bg-app)",
                  color: "var(--color-text-primary)",
                }}
              />
            </div>
          </div>

          {/* Description */}
          <div className="mt-5">
            <p className="mb-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
              Description
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => {
                if (description !== (task.description ?? ""))
                  void save({ description: description || null });
              }}
              rows={5}
              placeholder="Ajouter une description..."
              className="w-full resize-none rounded border p-3 text-sm focus:outline-none"
              style={{
                borderColor: "var(--color-border-default)",
                backgroundColor: "var(--color-bg-app)",
                color: "var(--color-text-primary)",
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-5 py-3" style={{ borderColor: "var(--color-border-subtle)" }}>
          <button
            onClick={() => void handleDelete()}
            className="flex items-center gap-1.5 text-xs hover:underline"
            style={{ color: "var(--color-priority-high)" }}
          >
            <Trash2 size={13} />
            Supprimer la tâche
          </button>
        </div>
      </div>
    </>
  );
}
