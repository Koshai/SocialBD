import { Card, CardDescription, CardTitle } from "@socialbd/ui";
import { countScheduledPosts, listPostsForOrganization } from "@socialbd/db";

import { getDashboardSession } from "@/lib/dashboard-session";

import { OverviewScheduledCardLive } from "./overview-scheduled-card-live";

export async function OverviewScheduledCard() {
  const session = await getDashboardSession();
  const organizationId = session?.session.activeOrganizationId;

  if (!organizationId) {
    return (
      <Card>
        <CardTitle>Scheduled</CardTitle>
        <CardDescription>Select a workspace to see scheduled posts.</CardDescription>
      </Card>
    );
  }

  const [posts, scheduledCount] = await Promise.all([
    listPostsForOrganization(organizationId, 5),
    countScheduledPosts(organizationId),
  ]);

  return <OverviewScheduledCardLive initial={{ posts, scheduledCount }} />;
}
