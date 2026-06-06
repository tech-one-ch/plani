"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

type Member = {
  userId: string;
  role: string;
  joinedAt: Date;
  name: string;
  email: string;
  image: string | null;
};

interface Props {
  members: Member[];
  workspaceId: string;
  currentUserId: string;
}

export function MemberList({ members: initial, workspaceId, currentUserId }: Props) {
  const [members, setMembers] = useState(initial);

  async function handleRemove(userId: string, name: string) {
    if (!confirm(`Retirer ${name} du workspace ?`)) return;
    try {
      const res = await fetch(`/api/v1/workspaces/${workspaceId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error();
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      toast.success(`${name} retiré du workspace`);
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  }

  function initials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  }

  return (
    <div
      className="overflow-hidden rounded-lg border"
      style={{ borderColor: "var(--color-border-subtle)" }}
    >
      <table className="w-full">
        <thead>
          <tr
            className="border-b"
            style={{
              borderColor: "var(--color-border-subtle)",
              backgroundColor: "var(--color-bg-elevated)",
            }}
          >
            <th
              className="px-5 py-3 text-left text-xs font-medium"
              style={{ color: "var(--color-text-muted)" }}
            >
              Membre
            </th>
            <th
              className="px-5 py-3 text-left text-xs font-medium"
              style={{ color: "var(--color-text-muted)" }}
            >
              Rôle
            </th>
            <th
              className="px-5 py-3 text-left text-xs font-medium"
              style={{ color: "var(--color-text-muted)" }}
            >
              Rejoint le
            </th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr
              key={member.userId}
              className="border-b"
              style={{
                borderColor: "var(--color-border-subtle)",
                backgroundColor: "var(--color-bg-app)",
              }}
            >
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: "var(--color-accent-subtle)",
                      color: "var(--color-accent)",
                    }}
                  >
                    {initials(member.name)}
                  </div>
                  <div>
                    <p
                      className="text-xs font-medium"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {member.name}
                    </p>
                    <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                      {member.email}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3">
                <span
                  className="rounded px-2 py-0.5 text-[10px] font-medium capitalize"
                  style={{
                    backgroundColor: "var(--color-bg-elevated)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {member.role}
                </span>
              </td>
              <td className="px-5 py-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
                {new Date(member.joinedAt).toLocaleDateString("fr-CH", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="px-5 py-3 text-right">
                {member.userId !== currentUserId && (
                  <button
                    onClick={() => void handleRemove(member.userId, member.name)}
                    className="icon-hover-danger"
                    title="Retirer ce membre"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
