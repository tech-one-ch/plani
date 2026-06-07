// apps/web/src/components/kanban/column.tsx
"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useState } from "react";
import { TaskCard } from "./task-card";

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

const STATUS_DOT: Record<string, string> = {
  backlog: "var(--color-border-default)",
  todo: "var(--color-text-muted)",
  in_progress: "var(--color-accent)",
  done: "var(--color-priority-low)",
};

interface Props {
  id: "backlog" | "todo" | "in_progress" | "done";
  label: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onQuickAdd: (status: string, title: string) => Promise<void>;
}

export function KanbanColumn({ id, label, tasks, onTaskClick, onQuickAdd }: Props) {
  const [quickInput, setQuickInput] = useState("");
  const { setNodeRef, isOver } = useDroppable({ id });

  async function handleQuickAdd(e: React.KeyboardEvent) {
    if (e.key !== "Enter" || !quickInput.trim()) return;
    await onQuickAdd(id, quickInput.trim());
    setQuickInput("");
  }

  return (
    <div className="flex w-60 flex-shrink-0 flex-col gap-2">
      {/* Column header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_DOT[id] }} />
          <span
            className="text-[11px] font-semibold tracking-wider uppercase"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {label}
          </span>
        </div>
        <span
          className="rounded px-1.5 text-[10px]"
          style={{ backgroundColor: "var(--color-bg-elevated)", color: "var(--color-text-muted)" }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className="flex flex-1 flex-col gap-2 rounded-md p-1 transition-colors"
        style={{ backgroundColor: isOver ? "var(--color-accent-subtle)" : undefined }}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </SortableContext>

        {/* Quick add */}
        <input
          type="text"
          value={quickInput}
          onChange={(e) => setQuickInput(e.target.value)}
          onKeyDown={(e) => void handleQuickAdd(e)}
          placeholder="+ Ajouter une tâche"
          className="rounded border border-dashed bg-transparent px-2 py-1.5 text-xs focus:outline-none"
          style={{
            borderColor: "var(--color-border-default)",
            color: "var(--color-text-muted)",
          }}
        />
      </div>
    </div>
  );
}
