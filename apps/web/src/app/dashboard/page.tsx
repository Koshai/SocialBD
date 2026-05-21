import { OverviewChannelsCard } from "@/components/connected-accounts/overview-channels-card";
import { OverviewScheduledCard } from "@/components/composer/overview-scheduled-card";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { OverviewWorkspaceCard } from "@/components/organization/overview-workspace-card";

export default function DashboardOverviewPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <OverviewWorkspaceCard />
        <OverviewChannelsCard />
        <OverviewScheduledCard />
      </section>
      <DashboardOverview />
    </div>
  );
}
