"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@socialbd/ui";

import { usePreferences } from "@/components/preferences/preferences-provider";
import { authClient } from "@/lib/auth-client";

type OrganizationSwitcherProps = {
  /** Full-width select, hide New button (mobile header row). */
  compact?: boolean;
};

export function OrganizationSwitcher({ compact = false }: OrganizationSwitcherProps) {
  const { t } = usePreferences();
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
        {t("common.loadingWorkspaces")}
      </span>
    );
  }

  if (!organizations?.length) {
    return null;
  }

  return (
    <label
      className={[
        "flex items-center gap-2 text-sm",
        compact ? "w-full" : "",
      ].join(" ")}
    >
      <span className="sr-only">{t("common.activeWorkspace")}</span>
      {!compact ? (
        <span className="hidden text-muted lg:inline">{t("common.workspace")}</span>
      ) : null}
      <select
        value={activeOrganization?.id ?? ""}
        disabled={pending}
        onChange={(e) => handleChange(e.target.value)}
        className={[
          "h-10 rounded-lg border border-border bg-background px-2 text-sm",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          compact ? "min-h-11 w-full max-w-none" : "max-w-[12rem] truncate sm:max-w-[14rem] h-9",
        ].join(" ")}
      >
        {organizations.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>
      {!compact ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard/workspaces/new")}
        >
          {t("common.new")}
        </Button>
      ) : null}
    </label>
  );
}
