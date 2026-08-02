"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, CardDescription, CardTitle } from "@socialbd/ui";

import { usePreferences } from "@/components/preferences/preferences-provider";
import { PlatformPostLink } from "@/components/posts/platform-post-link";
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
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    initial?.channels[0]?.id ?? null,
  );

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
    setSelectedChannelId((current) => {
      if (current && data.channels.some((channel) => channel.id === current)) return current;
      return data.channels[0]?.id ?? null;
    });
  }, [t]);

  useEffect(() => {
    if (!initial) {
      void refresh();
    }
  }, [initial, refresh]);

  const selectedChannel = useMemo(() => {
    if (!snapshot || !selectedChannelId) return null;
    return snapshot.channels.find((channel) => channel.id === selectedChannelId) ?? null;
  }, [snapshot, selectedChannelId]);

  const channelPosts = useMemo(() => {
    if (!snapshot || !selectedChannel) return [];
    return snapshot.posts.filter((post) => post.pageId === selectedChannel.pageId);
  }, [snapshot, selectedChannel]);

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

  const { channels, totals, warnings } = snapshot;

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
        <p className="text-sm text-muted">{t("analytics.sourceNoteHandoff")}</p>
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => void refresh()}>
          {pending ? t("analytics.refreshing") : t("analytics.refresh")}
        </Button>
      </div>

      <Card>
        <CardTitle className="text-base">{t("analytics.published")}</CardTitle>
        <p className="mt-2 text-3xl font-bold">{formatNumber(totals.publishedPosts)}</p>
        <CardDescription>{t("analytics.publishedDesc")}</CardDescription>
      </Card>

      {channels.length === 0 ? (
        <Card>
          <CardTitle>{t("analytics.channelsTitle")}</CardTitle>
          <CardDescription>{t("analytics.emptyPosts")}</CardDescription>
        </Card>
      ) : (
        <>
          <Card>
            <CardTitle>{t("analytics.channelsTitle")}</CardTitle>
            <CardDescription>{t("analytics.selectChannel")}</CardDescription>
            <div className="mt-4 flex flex-wrap gap-2">
              {channels.map((channel) => {
                const selected = channel.id === selectedChannelId;
                return (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => setSelectedChannelId(channel.id)}
                    className={`min-w-[12rem] flex-1 rounded-xl border px-4 py-3 text-left transition-colors sm:flex-none ${
                      selected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border bg-background hover:border-primary/40"
                    }`}
                  >
                    <p className="font-medium">{channel.displayName}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {getPlatformLabel(channel.platform, t)}
                    </p>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="text-xs text-muted">{t("analytics.publishedOnChannel")}</dt>
                        <dd className="font-semibold">{formatNumber(channel.publishedPosts)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted">{t("analytics.followersLabel")}</dt>
                        <dd className="font-semibold">{formatNumber(channel.followers)}</dd>
                      </div>
                    </dl>
                  </button>
                );
              })}
            </div>
          </Card>

          {selectedChannel ? (
            <Card>
              <CardTitle>{selectedChannel.displayName}</CardTitle>
              <CardDescription>
                {getPlatformLabel(selectedChannel.platform, t)}
                {" · "}
                {formatNumber(selectedChannel.publishedPosts)} {t("analytics.publishedOnChannel").toLowerCase()}
                {" · "}
                {selectedChannel.followers == null
                  ? t("analytics.followersUnavailable")
                  : `${formatNumber(selectedChannel.followers)} ${t("analytics.followersLabel").toLowerCase()}`}
              </CardDescription>

              <h3 className="mt-6 text-sm font-semibold">{t("analytics.channelPostsTitle")}</h3>
              {channelPosts.length === 0 ? (
                <p className="mt-3 text-sm text-muted">{t("analytics.channelPostsEmpty")}</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {channelPosts.map((post) => (
                    <li key={post.id} className="rounded-lg border border-border px-3 py-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs text-muted">{formatWhen(post.publishedAt)}</span>
                      </div>
                      <p className="mt-2 line-clamp-3 whitespace-pre-wrap">{post.body}</p>
                      <PlatformPostLink
                        postId={post.id}
                        platform={post.platform}
                        status="published"
                        externalPostId={post.externalPostId}
                        pageId={post.pageId}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
