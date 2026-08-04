"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { usePreferences } from "@/components/preferences/preferences-provider";
import { authClient } from "@/lib/auth-client";

import { CreateWorkspaceForm } from "./create-workspace-form";

type WorkspaceGateProps = {
  children: React.ReactNode;
  /** From server session — paint content without waiting on client org hooks. */
  hasActiveOrganization?: boolean;
  hasAnyOrganization?: boolean;
};

export function WorkspaceGate({
  children,
  hasActiveOrganization = false,
  hasAnyOrganization = false,
}: WorkspaceGateProps) {
  const { t } = usePreferences();
  const pathname = usePathname();
  const router = useRouter();
  const { data: organizations, isPending } = authClient.useListOrganizations();
  const { data: activeOrganization } = authClient.useActiveOrganization();

  useEffect(() => {
    const first = organizations?.[0];
    if (!first || activeOrganization) return;

    void authClient.organization.setActive({ organizationId: first.id }).then(() => router.refresh());
  }, [organizations, activeOrganization, router]);

  // Prefer server bootstrap: users with a workspace never wait on client org list.
  if (hasActiveOrganization || hasAnyOrganization) {
    return children;
  }

  if (isPending) {
    return (
      <p className="text-sm text-muted" aria-live="polite">
        {t("common.loadingYourWorkspaces")}
      </p>
    );
  }

  if (!organizations?.length && !pathname.startsWith("/dashboard/workspaces")) {
    return <CreateWorkspaceForm />;
  }

  return children;
}
