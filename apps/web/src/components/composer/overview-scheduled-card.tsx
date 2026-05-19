import { Card, CardDescription, CardTitle } from "@socialbd/ui";
import { countScheduledPosts } from "@socialbd/db";

import { getDashboardSession } from "@/lib/dashboard-session";

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

  const count = await countScheduledPosts(organizationId);

  return (
    <Card>
      <CardTitle>Scheduled</CardTitle>
      <CardDescription>
        {count === 0
          ? "No posts in your queue yet. Open Composer to draft or schedule one."
          : `${count} post${count === 1 ? "" : "s"} scheduled — view in Calendar soon.`}
      </CardDescription>
    </Card>
  );
}
