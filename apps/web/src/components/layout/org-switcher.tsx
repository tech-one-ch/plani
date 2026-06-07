"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import { organization } from "@/lib/auth-client";

type Org = { id: string; name: string };

interface Props {
  currentOrgId: string | null;
  orgs: Org[];
}

export function OrgSwitcher({ currentOrgId, orgs }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const current = orgs.find((o) => o.id === currentOrgId);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function switchOrg(orgId: string) {
    if (orgId === currentOrgId || loading) return;
    setLoading(true);
    setOpen(false);
    await organization.setActive({ organizationId: orgId });
    router.refresh();
    setLoading(false);
  }

  if (!current) return null;

  // Single org — just a static badge, no dropdown
  if (orgs.length <= 1) {
    return (
      <span
        className="rounded border px-2 py-0.5 text-xs"
        style={{
          borderColor: "var(--color-border-default)",
          backgroundColor: "var(--color-bg-elevated)",
          color: "var(--color-text-secondary)",
        }}
      >
        {current.name}
      </span>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded border px-2 py-0.5 text-xs transition-colors"
        style={{
          borderColor: "var(--color-border-default)",
          backgroundColor: "var(--color-bg-elevated)",
          color: "var(--color-text-secondary)",
        }}
      >
        {loading ? "…" : current.name}
        <ChevronDown size={10} />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 z-50 mt-1 min-w-[160px] overflow-hidden rounded-md border py-1 shadow-lg"
          style={{
            borderColor: "var(--color-border-subtle)",
            backgroundColor: "var(--color-bg-elevated)",
          }}
        >
          {orgs.map((org) => (
            <button
              key={org.id}
              onClick={() => void switchOrg(org.id)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors"
              style={{
                color:
                  org.id === currentOrgId ? "var(--color-accent)" : "var(--color-text-primary)",
                backgroundColor: org.id === currentOrgId ? "var(--color-accent-subtle)" : undefined,
              }}
            >
              {org.name}
              {org.id === currentOrgId && <Check size={10} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
