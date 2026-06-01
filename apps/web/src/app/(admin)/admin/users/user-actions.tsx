"use client";

import { Button } from "@plani/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface UserActionsProps {
  userId: string;
  role: string | null;
  banned: boolean;
}

export function UserActions({ userId, role, banned }: UserActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function call(action: string) {
    setLoading(true);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("Action failed");
      return;
    }
    toast.success("Done");
    router.refresh();
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {banned ? (
        <Button size="sm" variant="outline" disabled={loading} onClick={() => void call("unban")}>
          Unban
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() => void call("ban")}
          className="text-red-600 hover:text-red-700"
        >
          Ban
        </Button>
      )}
      {role === "admin" ? (
        <Button size="sm" variant="ghost" disabled={loading} onClick={() => void call("demote")}>
          Remove admin
        </Button>
      ) : (
        <Button size="sm" variant="ghost" disabled={loading} onClick={() => void call("promote")}>
          Make admin
        </Button>
      )}
    </div>
  );
}
