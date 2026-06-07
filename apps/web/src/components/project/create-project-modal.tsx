// apps/web/src/components/project/create-project-modal.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

const COLORS = ["#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b", "#ef4444", "#ec4899"];

interface CreateProjectModalProps {
  onClose: () => void;
}

export function CreateProjectModal({ onClose }: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]!);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/v1/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), color }),
      });
      if (!res.ok) throw new Error("Failed");
      onClose();
      router.refresh();
    } catch {
      setError("Erreur lors de la création du projet");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg border p-6"
        style={{
          borderColor: "var(--color-border-subtle)",
          backgroundColor: "var(--color-bg-elevated)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-semibold" style={{ color: "var(--color-text-white)" }}>
            Nouveau projet
          </h2>
          <button onClick={onClose} style={{ color: "var(--color-text-muted)" }}>
            <X size={16} />
          </button>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
          <div>
            <label
              className="mb-1.5 block text-xs font-medium"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Nom
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mon projet"
              required
              autoFocus
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
              style={{
                borderColor: "var(--color-border-default)",
                backgroundColor: "var(--color-bg-app)",
                color: "var(--color-text-primary)",
              }}
            />
          </div>
          <div>
            <label
              className="mb-1.5 block text-xs font-medium"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Couleur
            </label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-6 w-6 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    outline: color === c ? "2px solid white" : "none",
                    outlineOffset: "2px",
                  }}
                />
              ))}
            </div>
          </div>
          {error && (
            <p className="text-xs" style={{ color: "var(--color-priority-high)" }}>
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-1.5 text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="rounded-md px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: "var(--color-accent)" }}
            >
              {loading ? "..." : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
