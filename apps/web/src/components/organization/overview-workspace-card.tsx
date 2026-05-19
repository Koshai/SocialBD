"use client";

import { Card, CardDescription, CardTitle } from "@socialbd/ui";

import { authClient } from "@/lib/auth-client";

export function OverviewWorkspaceCard() {
  const { data: activeOrganization } = authClient.useActiveOrganization();

  return (
    <Card>
      <CardTitle>Workspace</CardTitle>
      <CardDescription>
        {activeOrganization
          ? `Active: ${activeOrganization.name} (${activeOrganization.slug})`
          : "Select or create a workspace from the header."}
      </CardDescription>
    </Card>
  );
}
