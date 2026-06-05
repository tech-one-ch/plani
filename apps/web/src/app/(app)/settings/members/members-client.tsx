"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { MemberList } from "@/components/members/member-list";
import { InviteModal } from "@/components/members/invite-modal";

type Member = {
  userId: string;
  role: string;
  joinedAt: Date;
  name: string;
  email: string;
  image: string | null;
};
type Workspace = { id: string; name: string };

export function MembersPageClient({
  workspace,
  members,
  currentUserId,
}: {
  workspace: Workspace;
  members: Member[];
  currentUserId: string;
}) {
  const [showInvite, setShowInvite] = useState(false);

  return (
    <div className="max-w-3xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold" style={{ color: "var(--color-text-white)" }}>
          Membres
        </h1>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--color-accent)" }}
        >
          <UserPlus size={14} />
          Inviter un membre
        </button>
      </div>

      <MemberList members={members} workspaceId={workspace.id} currentUserId={currentUserId} />

      {showInvite && (
        <InviteModal workspaceId={workspace.id} onClose={() => setShowInvite(false)} />
      )}
    </div>
  );
}
