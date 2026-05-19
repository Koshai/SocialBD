import { Card, CardDescription, CardTitle } from "@socialbd/ui";

import { countConnectedAccounts } from "@/lib/connected-accounts";
import { getDashboardSession } from "@/lib/dashboard-session";

export async function OverviewChannelsCard() {
  const session = await getDashboardSession();
  const organizationId = session?.session.activeOrganizationId;

  if (!organizationId) {
    return (
      <Card>
        <CardTitle>Channels</CardTitle>
        <CardDescription>Select a workspace to see connected channels.</CardDescription>
      </Card>
    );
  }

  const count = await countConnectedAccounts(organizationId);

  return (
    <Card>
      <CardTitle>Channels</CardTitle>
      <CardDescription>
        {count === 0
          ? "0 connected — link Facebook Pages from Accounts."
          : `${count} connected — manage them from Accounts.`}
      </CardDescription>
    </Card>
  );
}
