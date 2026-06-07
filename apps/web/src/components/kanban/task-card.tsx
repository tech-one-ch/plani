// apps/web/src/components/kanban/task-card.tsx
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Task = {
  id: string;
  title: string;
  priority: "low" | "medium" | "high";
  dueDate: string | null;
  status: "backlog" | "todo" | "in_progress" | "done";
  position: number;
};

const PRIORITY_STYLE: Record<string, { bg: string; text: string }> = {
  high: { bg: "#3b1212", text: "var(--color-priority-high)" },
  medium: { bg: "#3b2a12", text: "var(--color-priority-medium)" },
  low: { bg: "#123b1a", text: "var(--color-priority-low)" },
};
const PRIORITY_LABEL: Record<string, string> = { high: "Haute", medium: "Moyenne", low: "Basse" };

interface Props {
  task: Task;
  onClick: () => void;
}

export function TaskCard({ task, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        borderColor: "var(--color-border-subtle)",
        backgroundColor: "var(--color-bg-elevated)",
      }}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="cursor-pointer rounded-md border p-3 transition-colors"
    >
      <p className="mb-2 line-clamp-2 text-xs" style={{ color: "var(--color-text-primary)" }}>
        {task.title}
      </p>
      <div className="flex items-center gap-2">
        <span
          className="rounded px-1.5 py-0.5 text-[10px] font-medium"
          style={{
            backgroundColor: PRIORITY_STYLE[task.priority]?.bg,
            color: PRIORITY_STYLE[task.priority]?.text,
          }}
        >
          {PRIORITY_LABEL[task.priority]}
        </span>
        {task.dueDate && (
          <span
            className="ml-auto text-[10px]"
            style={{ color: isOverdue ? "var(--color-priority-high)" : "var(--color-text-muted)" }}
          >
            {new Date(task.dueDate).toLocaleDateString("fr-CH", { day: "numeric", month: "short" })}
          </span>
        )}
      </div>
    </div>
  );
}
