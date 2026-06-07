// apps/web/src/components/notes/note-list.tsx
"use client";

import { Plus } from "lucide-react";

type Note = { id: string; title: string; content: string; updatedAt: Date; createdAt: Date };

interface Props {
  notes: Note[];
  selectedId: string | null;
  onSelect: (note: Note) => void;
  onNew: () => void;
}

export function NoteList({ notes, selectedId, onSelect, onNew }: Props) {
  function excerpt(content: string) {
    return (
      content
        .replace(/<[^>]+>/g, " ")
        .trim()
        .substring(0, 60) || "Aucun contenu"
    );
  }

  return (
    <div
      className="flex h-full w-60 flex-shrink-0 flex-col border-r"
      style={{
        borderColor: "var(--color-border-subtle)",
        backgroundColor: "var(--color-bg-sidebar)",
      }}
    >
      <div
        className="flex items-center justify-between border-b px-4 py-3"
        style={{ borderColor: "var(--color-border-subtle)" }}
      >
        <span className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
          Notes
        </span>
        <button onClick={onNew} style={{ color: "var(--color-text-muted)" }}>
          <Plus size={14} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 && (
          <p className="p-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
            Aucune note. Créez-en une.
          </p>
        )}
        {notes.map((note) => (
          <button
            key={note.id}
            onClick={() => onSelect(note)}
            className="w-full border-b px-4 py-3 text-left transition-colors"
            style={{
              borderColor: "var(--color-border-subtle)",
              backgroundColor: selectedId === note.id ? "var(--color-accent-subtle)" : undefined,
            }}
          >
            <p
              className="mb-0.5 truncate text-xs font-medium"
              style={{
                color: selectedId === note.id ? "var(--color-accent)" : "var(--color-text-primary)",
              }}
            >
              {note.title || "Sans titre"}
            </p>
            <p className="truncate text-[10px]" style={{ color: "var(--color-text-muted)" }}>
              {excerpt(note.content)}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
