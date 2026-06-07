// apps/web/src/components/kanban/board.tsx
"use client";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useState } from "react";
import { KanbanColumn } from "./column";
import { TaskCard } from "./task-card";
import { TaskDetailPanel } from "@/components/tasks/task-detail-panel";
import { calculatePosition } from "@/lib/position";

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

const COLUMNS: { id: Task["status"]; label: string }[] = [
  { id: "backlog", label: "Backlog" },
  { id: "todo", label: "À faire" },
  { id: "in_progress", label: "En cours" },
  { id: "done", label: "Terminé" },
];

export function KanbanBoard({
  projectId,
  initialTasks,
}: {
  projectId: string;
  initialTasks: Task[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function getColumnTasks(status: Task["status"]) {
    return tasks.filter((t) => t.status === status).sort((a, b) => a.position - b.position);
  }

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const draggedTask = tasks.find((t) => t.id === active.id);
    if (!draggedTask) return;

    const newStatus =
      COLUMNS.find((c) => c.id === over.id)?.id ?? tasks.find((t) => t.id === over.id)?.status;

    if (!newStatus) return;

    const columnTasks = getColumnTasks(newStatus).filter((t) => t.id !== draggedTask.id);
    const overIndex = columnTasks.findIndex((t) => t.id === over.id);

    const prev = overIndex > 0 ? (columnTasks[overIndex - 1]?.position ?? null) : null;
    const next = overIndex >= 0 ? (columnTasks[overIndex]?.position ?? null) : null;
    const newPosition = calculatePosition(prev, next);

    setTasks((prev) =>
      prev.map((t) =>
        t.id === draggedTask.id ? { ...t, status: newStatus, position: newPosition } : t,
      ),
    );

    try {
      await fetch(`/api/v1/tasks/${draggedTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, position: newPosition }),
      });
    } catch {
      setTasks(initialTasks);
    }
  }

  async function handleQuickAdd(status: string, title: string) {
    const columnTasks = getColumnTasks(status as Task["status"]);
    const lastPosition = columnTasks[columnTasks.length - 1]?.position ?? null;
    const position = calculatePosition(lastPosition, null);

    try {
      const res = await fetch(`/api/v1/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, status, position }),
      });
      if (!res.ok) throw new Error();
      const newTask = (await res.json()) as Task;
      setTasks((prev) => [...prev, newTask]);
    } catch {
      // fail silently
    }
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={(e) => void handleDragEnd(e)}
      >
        <div className="flex h-full gap-4 overflow-x-auto p-6">
          {COLUMNS.map(({ id, label }) => (
            <KanbanColumn
              key={id}
              id={id}
              label={label}
              tasks={getColumnTasks(id)}
              onTaskClick={setSelectedTask}
              onQuickAdd={handleQuickAdd}
            />
          ))}
        </div>
        <DragOverlay>{activeTask && <TaskCard task={activeTask} onClick={() => {}} />}</DragOverlay>
      </DndContext>

      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={(updated) => {
            setTasks((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
            setSelectedTask(updated);
          }}
          onDelete={(id) => setTasks((prev) => prev.filter((t) => t.id !== id))}
        />
      )}
    </>
  );
}
