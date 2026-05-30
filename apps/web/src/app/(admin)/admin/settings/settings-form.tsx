"use client";

import { Button } from "@plani/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function SettingsForm({ allowSignup }: { allowSignup: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState(allowSignup);

  async function toggle() {
    setLoading(true);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allow_signup: !value }),
    });
    setLoading(false);

    if (!res.ok) {
      toast.error("Failed to update setting");
      return;
    }
    setValue(!value);
    toast.success(`Open registration ${!value ? "enabled" : "disabled"}`);
    router.refresh();
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-zinc-800">Open registration</p>
        <p className="mt-0.5 text-xs text-zinc-500">
          Allow anyone to create an account. Disable for invite-only mode.
        </p>
      </div>
      <Button
        variant={value ? "outline" : "default"}
        size="sm"
        onClick={() => void toggle()}
        disabled={loading}
      >
        {value ? "Enabled — click to disable" : "Disabled — click to enable"}
      </Button>
    </div>
  );
}
