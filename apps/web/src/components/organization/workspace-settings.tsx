"use client";

import Link from "next/link";
import { Button, Card, CardDescription, CardTitle } from "@socialbd/ui";

import { usePreferences } from "@/components/preferences/preferences-provider";
import { authClient } from "@/lib/auth-client";

import { WorkspaceTeamInvite } from "./workspace-team-invite";

type WorkspaceSettingsProps = {
  canInvite: boolean;
};

export function WorkspaceSettings({ canInvite }: WorkspaceSettingsProps) {
  const { t } = usePreferences();
  const { data: organizations, isPending } = authClient.useListOrganizations();
  const { data: activeOrganization } = authClient.useActiveOrganization();

  if (isPending) {
    return <p className="text-sm text-muted">{t("common.loadingWorkspaces")}</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>{t("workspace.workspaces")}</CardTitle>
        <CardDescription>{t("workspace.workspacesDesc")}</CardDescription>
        <ul className="mt-4 space-y-2">
          {organizations?.map((org) => (
            <li
              key={org.id}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
            >
              <span>
                <span className="font-medium">{org.name}</span>
                <span className="ml-2 text-muted">/{org.slug}</span>
              </span>
              {org.id === activeOrganization?.id ? (
                <span className="text-xs font-medium text-primary">{t("common.active")}</span>
              ) : null}
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <Link href="/dashboard/workspaces/new">
            <Button variant="outline">{t("workspace.createWorkspace")}</Button>
          </Link>
        </div>
      </Card>

      {activeOrganization ? (
        <WorkspaceTeamInvite organizationId={activeOrganization.id} canInvite={canInvite} />
      ) : null}
    </div>
  );
}
