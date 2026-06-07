"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { organization } from "@/lib/auth-client";
import { toast } from "sonner";

interface Props {
  onClose: () => void;
}

export function CreateOrgModal({ onClose }: Props) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await organization.create({
        name: name.trim(),
        slug: name.trim().toLowerCase().replace(/\s+/g, "-"),
      });
      toast.success("Organisation créée");
      router.refresh();
      onClose();
    } catch {
      toast.error("Erreur lors de la création de l'organisation");
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
            Nouvelle organisation
          </h2>
          <button onClick={onClose} className="icon-hover">
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
              placeholder="Mon équipe"
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
              {loading ? "Création..." : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
