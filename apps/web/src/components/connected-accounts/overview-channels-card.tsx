import { Card, CardDescription, CardTitle } from "@socialbd/ui";

import { countConnectedAccounts } from "@/lib/connected-accounts";
import { getDashboardSession } from "@/lib/dashboard-session";
import { getServerTranslator } from "@/lib/i18n/server";

export async function OverviewChannelsCard() {
  const t = await getServerTranslator();
  const session = await getDashboardSession();
  const organizationId = session?.session.activeOrganizationId;

  if (!organizationId) {
    return (
      <Card>
        <CardTitle>{t("workspace.channelsTitle")}</CardTitle>
        <CardDescription>{t("workspace.channelsSelectWorkspace")}</CardDescription>
      </Card>
    );
  }

  const count = await countConnectedAccounts(organizationId);

  return (
    <Card>
      <CardTitle>{t("workspace.channelsTitle")}</CardTitle>
      <CardDescription>
        {count === 0 ? t("workspace.channelsNone") : t("workspace.channelsCount", { count })}
      </CardDescription>
    </Card>
  );
}
