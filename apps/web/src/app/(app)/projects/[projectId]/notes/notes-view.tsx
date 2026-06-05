// apps/web/src/app/(app)/projects/[projectId]/notes/notes-view.tsx
"use client";

import { useState } from "react";
import { NoteList } from "@/components/notes/note-list";
import { NoteEditor } from "@/components/notes/note-editor";

type Note = { id: string; title: string; content: string; updatedAt: Date; createdAt: Date };

export function NotesView({
  projectId,
  initialNotes,
}: {
  projectId: string;
  initialNotes: Note[];
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [selected, setSelected] = useState<Note | null>(initialNotes[0] ?? null);

  async function handleNew() {
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/notes`, { method: "POST" });
      if (!res.ok) throw new Error();
      const note = (await res.json()) as Note;
      setNotes((prev) => [note, ...prev]);
      setSelected(note);
    } catch {
      // fail silently
    }
  }

  function handleUpdate(updated: Note) {
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    if (selected?.id === updated.id) setSelected(updated);
  }

  return (
    <div className="flex h-full">
      <NoteList
        notes={notes}
        selectedId={selected?.id ?? null}
        onSelect={(note) => setSelected(note)}
        onNew={() => void handleNew()}
      />
      <div className="flex-1 overflow-hidden">
        {selected ? (
          <NoteEditor key={selected.id} note={selected} onUpdate={handleUpdate} />
        ) : (
          <div
            className="flex h-full items-center justify-center text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            Sélectionnez une note ou créez-en une nouvelle.
          </div>
        )}
      </div>
    </div>
  );
}
