"use client";

import type { Task } from "@plani/db";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@plani/ui";
import { CalendarDays, User } from "lucide-react";
import type { Member } from "./board";

const PRIORITY_LABEL: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

interface TaskCardProps {
  task: Task;
  members: Member[];
  isDragging?: boolean;
  onClick: () => void;
}

export function TaskCard({ task, members, isDragging = false, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const assignee = members.find((m) => m.id === task.assigneeId);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="cursor-pointer rounded-lg border border-zinc-200 bg-white p-3 shadow-sm transition-all select-none hover:border-zinc-300 hover:shadow-md"
    >
      <p className="line-clamp-2 text-sm font-medium text-zinc-900">{task.title}</p>

      {(task.priority || task.assigneeId || task.dueDate) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {task.priority && (
            <Badge variant={task.priority ?? undefined}>{PRIORITY_LABEL[task.priority]}</Badge>
          )}
          {assignee && (
            <span className="flex items-center gap-1 text-xs text-zinc-400">
              <User className="h-3 w-3" />
              {assignee.name}
            </span>
          )}
          {task.dueDate && (
            <span className="flex items-center gap-1 text-xs text-zinc-400">
              <CalendarDays className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
