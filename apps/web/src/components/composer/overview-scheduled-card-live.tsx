"use client";

import { Card, CardDescription, CardTitle } from "@socialbd/ui";

import type { PostSnapshot } from "@/lib/posts-api";
import { usePostsSnapshot } from "@/hooks/use-posts-snapshot";

type OverviewScheduledCardLiveProps = {
  initial: PostSnapshot;
};

export function OverviewScheduledCardLive({ initial }: OverviewScheduledCardLiveProps) {
  const { snapshot, isPolling, hasPending } = usePostsSnapshot(initial);
  const { scheduledCount } = snapshot;

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle>Scheduled</CardTitle>
        {isPolling && hasPending ? (
          <span className="text-xs font-medium text-primary" aria-live="polite">
            Updating…
          </span>
        ) : null}
      </div>
      <CardDescription>
        {scheduledCount === 0
          ? "No posts in your queue. Schedule from Composer or view the calendar."
          : `${scheduledCount} post${scheduledCount === 1 ? "" : "s"} scheduled — see Calendar or wait for auto-publish.`}
      </CardDescription>
    </Card>
  );
}
