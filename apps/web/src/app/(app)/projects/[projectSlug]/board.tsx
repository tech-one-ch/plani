"use client";

import type { Project, Task } from "@plani/db";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { CreateTaskButton } from "./create-task-button";
import { TaskCard } from "./task-card";
import { TaskDialog } from "./task-dialog";

export type TaskStatus = "todo" | "in_progress" | "done";
export type Member = { id: string; name: string; email: string };

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "To do" },
  { id: "in_progress", label: "In progress" },
  { id: "done", label: "Done" },
];

interface BoardProps {
  project: Project;
  initialTasks: Task[];
  members: Member[];
  initialActiveTask: Task | null;
}

export function Board({ project, initialTasks, members, initialActiveTask }: BoardProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [dragging, setDragging] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(initialActiveTask);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const tasksByStatus = useCallback(
    (status: TaskStatus) =>
      tasks.filter((t) => t.status === status).sort((a, b) => a.position - b.position),
    [tasks],
  );

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setDragging(task);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    // Determine target status — over could be a column id or another task id
    const targetStatus = (
      COLUMNS.some((c) => c.id === over.id) ? over.id : tasks.find((t) => t.id === over.id)?.status
    ) as TaskStatus | undefined;

    if (!targetStatus || activeTask.status === targetStatus) return;

    // Optimistic move to new column
    setTasks((prev) =>
      prev.map((t) => (t.id === activeTask.id ? { ...t, status: targetStatus } : t)),
    );
  }

  async function handleDragEnd(event: DragEndEvent) {
    setDragging(null);
    const { active, over } = event;
    if (!over) return;

    const movedTask = tasks.find((t) => t.id === active.id);
    if (!movedTask) return;

    const targetStatus = (
      COLUMNS.some((c) => c.id === over.id)
        ? over.id
        : (tasks.find((t) => t.id === over.id)?.status ?? movedTask.status)
    ) as TaskStatus;

    const columnTasks = tasks
      .filter((t) => t.status === targetStatus)
      .sort((a, b) => a.position - b.position);

    const overIndex = columnTasks.findIndex((t) => t.id === over.id);
    const movedIndex = columnTasks.findIndex((t) => t.id === movedTask.id);

    // Reorder within column
    const reordered = [...columnTasks];
    if (movedIndex !== -1) reordered.splice(movedIndex, 1);
    const insertAt = overIndex === -1 ? reordered.length : overIndex;
    reordered.splice(insertAt, 0, movedTask);

    // Apply optimistic positions
    setTasks((prev) => {
      const others = prev.filter((t) => t.status !== targetStatus);
      return [...others, ...reordered.map((t, i) => ({ ...t, status: targetStatus, position: i }))];
    });

    // Persist to API
    const res = await fetch(`/api/tasks/${movedTask.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: targetStatus,
        position: insertAt,
        affectedIds: reordered.map((t) => t.id),
      }),
    });

    if (!res.ok) {
      toast.error("Failed to move task");
      setTasks(initialTasks); // revert on error
      router.refresh();
    }
  }

  function openTask(task: Task) {
    setSelectedTask(task);
    window.history.pushState(null, "", `?task=${task.id}`);
  }

  function closeTask() {
    setSelectedTask(null);
    window.history.pushState(null, "", window.location.pathname);
  }

  function onTaskUpdated(updated: Task) {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTask(updated);
  }

  function onTaskDeleted(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    closeTask();
  }

  function onTaskCreated(task: Task) {
    setTasks((prev) => [...prev, task]);
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={(e) => void handleDragEnd(e)}
      >
        <div className="grid grid-cols-3 gap-4">
          {COLUMNS.map((col) => {
            const colTasks = tasksByStatus(col.id);
            return (
              <div
                key={col.id}
                id={col.id}
                className="flex flex-col rounded-xl border border-zinc-200 bg-zinc-50"
              >
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-700">{col.label}</span>
                    <span className="rounded-full bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-500">
                      {colTasks.length}
                    </span>
                  </div>
                </div>

                <SortableContext
                  items={colTasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex min-h-[80px] flex-col gap-2 px-3 pb-3">
                    {colTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        members={members}
                        onClick={() => openTask(task)}
                      />
                    ))}
                  </div>
                </SortableContext>

                <div className="px-3 pb-3">
                  <CreateTaskButton
                    projectId={project.id}
                    defaultStatus={col.id}
                    members={members}
                    onCreated={onTaskCreated}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <DragOverlay>
          {dragging ? (
            <TaskCard task={dragging} members={members} isDragging onClick={() => {}} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {selectedTask && (
        <TaskDialog
          task={selectedTask}
          members={members}
          onClose={closeTask}
          onUpdated={onTaskUpdated}
          onDeleted={onTaskDeleted}
        />
      )}
    </>
  );
}
