"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  workspaceId: string;
  onClose: () => void;
}

export function InviteModal({ workspaceId, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "admin">("member");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/workspaces/${workspaceId}/members/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Invitation envoyée à ${email}`);
      onClose();
    } catch {
      toast.error("Erreur lors de l'envoi de l'invitation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
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
            Inviter un membre
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
              Adresse e-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="collaborateur@exemple.com"
              required
              autoFocus
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
              style={{
                borderColor: "var(--color-border-default)",
                backgroundColor: "var(--color-bg-app)",
                color: "var(--color-text-primary)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--color-accent)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border-default)";
              }}
            />
          </div>
          <div>
            <label
              className="mb-1.5 block text-xs font-medium"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Rôle
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "member" | "admin")}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
              style={{
                borderColor: "var(--color-border-default)",
                backgroundColor: "var(--color-bg-app)",
                color: "var(--color-text-primary)",
              }}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
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
              disabled={loading || !email.trim()}
              className="rounded-md px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: "var(--color-accent)" }}
            >
              {loading ? "Envoi..." : "Envoyer l'invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
