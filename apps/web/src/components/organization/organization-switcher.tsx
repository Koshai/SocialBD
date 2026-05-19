"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@socialbd/ui";

import { authClient } from "@/lib/auth-client";

export function OrganizationSwitcher() {
  const router = useRouter();
  const { data: organizations, isPending } = authClient.useListOrganizations();
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const [pending, setPending] = useState(false);

  async function handleChange(organizationId: string) {
    if (organizationId === activeOrganization?.id) return;
    setPending(true);
    await authClient.organization.setActive({ organizationId });
    router.refresh();
    setPending(false);
  }

  if (isPending) {
    return (
      <span className="text-sm text-muted" aria-live="polite">
        Loading workspaces...
      </span>
    );
  }

  if (!organizations?.length) {
    return null;
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only">Active workspace</span>
      <span className="hidden text-muted sm:inline">Workspace</span>
      <select
        value={activeOrganization?.id ?? ""}
        disabled={pending}
        onChange={(e) => handleChange(e.target.value)}
        className="h-9 max-w-[12rem] truncate rounded-lg border border-border bg-background px-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:max-w-[14rem]"
      >
        {organizations.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => router.push("/dashboard/workspaces/new")}
      >
        New
      </Button>
    </label>
  );
}
