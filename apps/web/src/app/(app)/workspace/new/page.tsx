"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function NewWorkspacePage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v1/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Workspace créé avec succès");
      router.push("/dashboard");
      router.refresh();
    } catch {
      const errorMsg = "Erreur lors de la création du workspace";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full items-center justify-center">
      <div
        className="w-full max-w-sm rounded-lg border p-8"
        style={{
          borderColor: "var(--color-border-subtle)",
          backgroundColor: "var(--color-bg-elevated)",
        }}
      >
        <h1 className="mb-1 text-lg font-semibold" style={{ color: "var(--color-text-white)" }}>
          Créer un workspace
        </h1>
        <p className="mb-6 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Un workspace regroupe vos projets et votre équipe.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              className="mb-1.5 block text-xs font-medium"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Nom du workspace
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mon équipe"
              required
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
              style={{
                borderColor: "var(--color-border-default)",
                backgroundColor: "var(--color-bg-app)",
                color: "var(--color-text-primary)",
              }}
            />
          </div>
          {error && (
            <p className="text-xs" style={{ color: "var(--color-priority-high)" }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: "var(--color-accent)" }}
          >
            {loading ? "Création..." : "Créer le workspace"}
          </button>
        </form>
      </div>
    </div>
  );
}
