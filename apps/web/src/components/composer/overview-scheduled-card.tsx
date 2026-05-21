import { Card, CardDescription, CardTitle } from "@socialbd/ui";
import { countScheduledPosts, listPostsForOrganization } from "@socialbd/db";

import { getDashboardSession } from "@/lib/dashboard-session";
import { getServerTranslator } from "@/lib/i18n/server";

import { OverviewScheduledCardLive } from "./overview-scheduled-card-live";

export async function OverviewScheduledCard() {
  const t = await getServerTranslator();
  const session = await getDashboardSession();
  const organizationId = session?.session.activeOrganizationId;

  if (!organizationId) {
    return (
      <Card>
        <CardTitle>{t("workspace.scheduledTitle")}</CardTitle>
        <CardDescription>{t("workspace.scheduledSelectWorkspace")}</CardDescription>
      </Card>
    );
  }

  const [posts, scheduledCount] = await Promise.all([
    listPostsForOrganization(organizationId, 5),
    countScheduledPosts(organizationId),
  ]);

  return (
    <OverviewScheduledCardLive initial={{ posts, scheduledCount, pendingApprovalCount: 0 }} />
  );
}
