"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@plani/ui";
import { useRouter } from "next/navigation";
import { organization } from "@/lib/auth-client";

interface Org {
  id: string;
  name: string;
}

interface OrgSwitcherProps {
  orgs: Org[];
  activeOrgId: string | null;
  activeOrgName: string | null;
}

export function OrgSwitcher({ orgs, activeOrgId, activeOrgName }: OrgSwitcherProps) {
  const router = useRouter();

  async function handleChange(orgId: string) {
    await organization.setActive({ organizationId: orgId });
    router.push("/dashboard");
    router.refresh();
  }

  if (orgs.length === 0) return null;

  return (
    <Select value={activeOrgId ?? ""} onValueChange={(v) => void handleChange(v)}>
      <SelectTrigger className="h-8 w-44 text-sm">
        <SelectValue placeholder="Select organization">
          {activeOrgName ?? "Select organization"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {orgs.map((org) => (
          <SelectItem key={org.id} value={org.id}>
            {org.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
