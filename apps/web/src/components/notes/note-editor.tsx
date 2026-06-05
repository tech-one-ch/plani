// apps/web/src/components/notes/note-editor.tsx
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extension-placeholder";
import { useCallback, useEffect, useRef, useState } from "react";

type Note = { id: string; title: string; content: string; updatedAt: Date; createdAt: Date };

interface Props {
  note: Note;
  onUpdate: (updated: Note) => void;
}

export function NoteEditor({ note, onUpdate }: Props) {
  const [title, setTitle] = useState(note.title);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "unsaved">("saved");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const saveContent = useCallback(
    async (id: string, updates: { title?: string; content?: string }) => {
      setSaveState("saving");
      try {
        const res = await fetch(`/api/v1/notes/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        if (!res.ok) throw new Error();
        const updated = (await res.json()) as Note;
        onUpdate(updated);
        setSaveState("saved");
      } catch {
        setSaveState("unsaved");
      }
    },
    [onUpdate],
  );

  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: "Commencer à écrire..." })],
    content: note.content,
    editorProps: {
      attributes: {
        class: "prose-note focus:outline-none text-sm min-h-[200px]",
        style: "color: var(--color-text-primary)",
      },
    },
    onUpdate({ editor }) {
      setSaveState("unsaved");
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        saveContent(note.id, { content: editor.getHTML() });
      }, 1000);
    },
  });

  useEffect(() => {
    setTitle(note.title);
    setSaveState("saved");
    if (editor && editor.getHTML() !== note.content) {
      editor.commands.setContent(note.content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div
        className="flex items-center justify-between border-b px-6 py-3"
        style={{ borderColor: "var(--color-border-subtle)" }}
      >
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setSaveState("unsaved");
          }}
          onBlur={() => {
            if (title !== note.title) saveContent(note.id, { title });
          }}
          placeholder="Sans titre"
          className="flex-1 bg-transparent text-sm font-semibold focus:outline-none"
          style={{ color: "var(--color-text-white)" }}
        />
        <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
          {saveState === "saving"
            ? "Enregistrement..."
            : saveState === "unsaved"
              ? "Non enregistré"
              : "Enregistré"}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
