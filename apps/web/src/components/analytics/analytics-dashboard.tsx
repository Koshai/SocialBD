"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card, CardDescription, CardTitle } from "@socialbd/ui";

import { usePreferences } from "@/components/preferences/preferences-provider";
import type { AnalyticsSnapshot } from "@/lib/analytics-types";
import { getPlatformLabel } from "@/lib/platform-labels";

function formatNumber(value: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat().format(value);
}

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

type AnalyticsDashboardProps = {
  initial: AnalyticsSnapshot | null;
  initialError?: string | null;
};

export function AnalyticsDashboard({ initial, initialError }: AnalyticsDashboardProps) {
  const { t } = usePreferences();
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(initial);
  const [error, setError] = useState(initialError ?? null);
  const [pending, setPending] = useState(false);

  const refresh = useCallback(async () => {
    setPending(true);
    setError(null);

    const response = await fetch("/api/analytics", { cache: "no-store" });
    const data = (await response.json()) as AnalyticsSnapshot & { error?: string };

    setPending(false);

    if (!response.ok) {
      setError(data.error ?? t("analytics.couldNotLoad"));
      return;
    }

    setSnapshot(data);
  }, [t]);

  useEffect(() => {
    if (!initial) {
      void refresh();
    }
  }, [initial, refresh]);

  if (error && !snapshot) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardTitle>{t("analytics.unavailable")}</CardTitle>
        <CardDescription>{error}</CardDescription>
        <Button type="button" className="mt-4" onClick={() => void refresh()}>
          {t("common.retry")}
        </Button>
      </Card>
    );
  }

  if (!snapshot) {
    return <p className="text-sm text-muted">{t("analytics.loading")}</p>;
  }

  const { channels, posts, totals, warnings } = snapshot;

  return (
    <div className="space-y-6">
      {warnings.length > 0 ? (
        <Card className="border-amber-200 bg-amber-50/80">
          <CardTitle className="text-base">{t("common.notes")}</CardTitle>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{t("analytics.sourceNote")}</p>
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => void refresh()}>
          {pending ? t("analytics.refreshing") : t("analytics.refresh")}
        </Button>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardTitle className="text-base">{t("analytics.published")}</CardTitle>
          <p className="mt-2 text-3xl font-bold">{formatNumber(totals.publishedPosts)}</p>
          <CardDescription>{t("analytics.publishedDesc")}</CardDescription>
        </Card>
        <Card>
          <CardTitle className="text-base">{t("analytics.engagement")}</CardTitle>
          <p className="mt-2 text-3xl font-bold">{formatNumber(totals.engagement)}</p>
          <CardDescription>{t("analytics.engagementDesc")}</CardDescription>
        </Card>
        <Card>
          <CardTitle className="text-base">{t("analytics.impressions")}</CardTitle>
          <p className="mt-2 text-3xl font-bold">{formatNumber(totals.impressions)}</p>
          <CardDescription>{t("analytics.impressionsDesc")}</CardDescription>
        </Card>
        <Card>
          <CardTitle className="text-base">{t("analytics.commentsCard")}</CardTitle>
          <p className="mt-2 text-3xl font-bold">{formatNumber(totals.comments)}</p>
          <CardDescription>{t("analytics.commentsDesc")}</CardDescription>
        </Card>
      </section>

      {channels.length > 0 ? (
        <Card>
          <CardTitle>{t("analytics.channelsTitle")}</CardTitle>
          <CardDescription>{t("analytics.channelsDesc")}</CardDescription>
          <ul className="mt-4 space-y-3">
            {channels.map((channel) => (
              <li
                key={channel.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span>
                  <span className="font-medium">{channel.displayName}</span>
                  <span className="ml-2 text-muted">{getPlatformLabel(channel.platform, t)}</span>
                </span>
                <span className="text-muted">
                  {channel.error
                    ? channel.error
                    : `${formatNumber(channel.followers)} ${t("common.followers")} · ${channel.publishedPosts} ${t("common.publishedCount")}`}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card>
        <CardTitle>{t("analytics.recentTitle")}</CardTitle>
        <CardDescription>{t("analytics.recentDesc", { count: posts.length })}</CardDescription>
        {posts.length === 0 ? (
          <p className="mt-4 text-sm text-muted">{t("analytics.emptyPosts")}</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {posts.map((post) => (
              <li key={post.id} className="rounded-lg border border-border px-3 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{post.channelName}</span>
                  <span className="text-xs text-muted">{formatWhen(post.publishedAt)}</span>
                </div>
                <p className="mt-2 line-clamp-2 whitespace-pre-wrap">{post.body}</p>
                {post.error ? (
                  <p className="mt-2 text-xs text-red-600">{post.error}</p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
                    <span>
                      {formatNumber(post.reactions)} {t("common.reactions")}
                    </span>
                    <span>
                      {formatNumber(post.comments)} {t("common.comments")}
                    </span>
                    <span>
                      {formatNumber(post.shares)} {t("common.shares")}
                    </span>
                    <span>
                      {formatNumber(post.impressions)} {t("common.impressions")}
                    </span>
                    <span className="font-medium text-foreground">
                      {formatNumber(post.engagement)} {t("common.totalEngagement")}
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
