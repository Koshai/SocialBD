import Link from "next/link";
import {
  countConnectedAccounts,
  countPostsByStatus,
  listDraftPosts,
  listPendingApprovalPosts,
  listUpcomingScheduledPosts,
} from "@socialbd/db";
import { Card, CardDescription, CardTitle } from "@socialbd/ui";

import { DashboardNavCards } from "@/components/dashboard/dashboard-nav-cards";
import { DashboardPostListCard } from "@/components/dashboard/dashboard-post-list-card";
import { getDashboardSession } from "@/lib/dashboard-session";
import { getServerTranslator } from "@/lib/i18n/server";
import { isAgentsFeatureEnabled } from "@/lib/features/agents";

function StatCard({
  label,
  value,
  href,
  hint,
}: {
  label: string;
  value: number;
  href: string;
  hint?: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </Link>
  );
}

export async function DashboardHome() {
  const t = await getServerTranslator();
  const session = await getDashboardSession();
  const organizationId = session?.session.activeOrganizationId;

  if (!organizationId) {
    return (
      <div className="space-y-6">
        <Card>
          <CardTitle>{t("dashboard.noWorkspaceTitle")}</CardTitle>
          <CardDescription>{t("dashboard.noWorkspaceDesc")}</CardDescription>
          <Link
            href="/dashboard/workspaces/new"
            className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
          >
            {t("workspace.createWorkspace")} →
          </Link>
        </Card>
        <DashboardNavCards />
      </div>
    );
  }

  const [counts, channels, scheduled, drafts, pending] = await Promise.all([
    countPostsByStatus(organizationId),
    countConnectedAccounts(organizationId),
    listUpcomingScheduledPosts(organizationId, 5),
    listDraftPosts(organizationId, 5),
    listPendingApprovalPosts(organizationId, 5),
  ]);

  const failed = counts.failed ?? 0;
  const showAgents = isAgentsFeatureEnabled();

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">{t("dashboard.snapshotTitle")}</h2>
          <p className="mt-1 text-sm text-muted">{t("dashboard.snapshotDesc")}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={t("dashboard.statScheduled")}
            value={counts.scheduled}
            href="/dashboard/calendar"
            hint={t("dashboard.statScheduledHint")}
          />
          <StatCard
            label={t("dashboard.statDrafts")}
            value={counts.draft}
            href="/dashboard/posts?status=draft"
            hint={t("dashboard.statDraftsHint")}
          />
          <StatCard
            label={t("dashboard.statPending")}
            value={counts.pending_approval}
            href="/dashboard/approvals"
            hint={t("dashboard.statPendingHint")}
          />
          <StatCard
            label={t("dashboard.statChannels")}
            value={channels}
            href="/dashboard/accounts"
            hint={
              failed > 0
                ? t("dashboard.statChannelsFailed", { count: failed })
                : t("dashboard.statChannelsHint")
            }
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <DashboardPostListCard
          title={t("dashboard.upcomingTitle")}
          description={t("dashboard.upcomingDesc")}
          empty={t("dashboard.upcomingEmpty")}
          viewAllHref="/dashboard/calendar"
          viewAllLabel={t("dashboard.viewCalendar")}
          posts={scheduled}
          t={t}
          timeField="scheduledAt"
          editComposer
        />
        <DashboardPostListCard
          title={t("dashboard.draftsTitle")}
          description={t("dashboard.draftsDesc")}
          empty={t("dashboard.draftsEmpty")}
          viewAllHref="/dashboard/posts?status=draft"
          viewAllLabel={t("dashboard.viewPosts")}
          posts={drafts}
          t={t}
          editComposer
        />
        <DashboardPostListCard
          title={t("dashboard.pendingTitle")}
          description={t("dashboard.pendingDesc")}
          empty={t("dashboard.pendingEmpty")}
          viewAllHref="/dashboard/approvals"
          viewAllLabel={t("dashboard.viewApprovals")}
          posts={pending}
          t={t}
        />
      </section>

      {showAgents ? (
        <Card className="border-primary/15 bg-primary/5">
          <CardTitle>{t("dashboard.agentsCueTitle")}</CardTitle>
          <CardDescription>{t("dashboard.agentsCueDesc")}</CardDescription>
          <Link
            href="/dashboard/agents"
            className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
          >
            {t("dashboard.agentsCueLink")} →
          </Link>
        </Card>
      ) : null}

      <DashboardNavCards />
    </div>
  );
}
