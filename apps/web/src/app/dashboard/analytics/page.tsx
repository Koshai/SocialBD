import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { buildAnalyticsSnapshot } from "@/lib/analytics-server";
import { requireActiveOrganization } from "@/lib/dashboard-session";
import { getServerTranslator } from "@/lib/i18n/server";

export default async function AnalyticsPage() {
  const { organizationId } = await requireActiveOrganization();
  const t = await getServerTranslator();

  try {
    const initial = await buildAnalyticsSnapshot(organizationId);
    return <AnalyticsDashboard initial={initial} />;
  } catch (error) {
    const message = error instanceof Error ? error.message : t("analytics.couldNotLoad");
    return <AnalyticsDashboard initial={null} initialError={message} />;
  }
}
