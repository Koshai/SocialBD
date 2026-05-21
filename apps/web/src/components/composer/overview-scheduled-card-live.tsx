"use client";

import { Card, CardDescription, CardTitle } from "@socialbd/ui";

import { usePreferences } from "@/components/preferences/preferences-provider";
import type { PostSnapshot } from "@/lib/posts-api";
import { usePostsSnapshot } from "@/hooks/use-posts-snapshot";

type OverviewScheduledCardLiveProps = {
  initial: PostSnapshot;
};

export function OverviewScheduledCardLive({ initial }: OverviewScheduledCardLiveProps) {
  const { t } = usePreferences();
  const { snapshot, isPolling, hasPending } = usePostsSnapshot(initial);
  const { scheduledCount } = snapshot;

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle>{t("workspace.scheduledTitle")}</CardTitle>
        {isPolling && hasPending ? (
          <span className="text-xs font-medium text-primary" aria-live="polite">
            {t("common.updating")}
          </span>
        ) : null}
      </div>
      <CardDescription>
        {scheduledCount === 0
          ? t("workspace.scheduledEmpty")
          : t("workspace.scheduledCount", {
              count: scheduledCount,
              plural: scheduledCount === 1 ? "" : "s",
            })}
      </CardDescription>
    </Card>
  );
}
