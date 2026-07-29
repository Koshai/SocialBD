import { Card, CardDescription, CardTitle } from "@socialbd/ui";
import type { PlanUsageSnapshot } from "@socialbd/db";

import { getServerTranslator } from "@/lib/i18n/server";

type PlanUsageCardProps = {
  usage: PlanUsageSnapshot;
};

export async function PlanUsageCard({ usage }: PlanUsageCardProps) {
  const t = await getServerTranslator();

  return (
    <Card>
      <CardTitle>{t("plan.title", { planName: usage.planName })}</CardTitle>
      <CardDescription>
        {t("plan.channelsUsage", {
          count: usage.connectedCount,
          max: usage.maxConnectedAccounts,
        })}
      </CardDescription>
      <p className="mt-3 text-sm text-muted">{t("plan.placeholderNote")}</p>
      {usage.atLimit ? (
        <p className="mt-2 text-sm font-medium text-amber-800">{t("plan.atLimit")}</p>
      ) : null}
    </Card>
  );
}
