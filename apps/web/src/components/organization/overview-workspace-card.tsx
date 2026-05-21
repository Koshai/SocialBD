"use client";

import { Card, CardDescription, CardTitle } from "@socialbd/ui";

import { usePreferences } from "@/components/preferences/preferences-provider";
import { authClient } from "@/lib/auth-client";

export function OverviewWorkspaceCard() {
  const { t } = usePreferences();
  const { data: activeOrganization } = authClient.useActiveOrganization();

  return (
    <Card>
      <CardTitle>{t("workspace.overviewTitle")}</CardTitle>
      <CardDescription>
        {activeOrganization
          ? t("workspace.overviewActive", {
              name: activeOrganization.name,
              slug: activeOrganization.slug,
            })
          : t("workspace.overviewNone")}
      </CardDescription>
    </Card>
  );
}
