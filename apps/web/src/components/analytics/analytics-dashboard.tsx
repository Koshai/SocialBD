"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card, CardDescription, CardTitle } from "@socialbd/ui";

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
      setError(data.error ?? "Could not load analytics.");
      return;
    }

    setSnapshot(data);
  }, []);

  useEffect(() => {
    if (!initial) {
      void refresh();
    }
  }, [initial, refresh]);

  if (error && !snapshot) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardTitle>Analytics unavailable</CardTitle>
        <CardDescription>{error}</CardDescription>
        <Button type="button" className="mt-4" onClick={() => void refresh()}>
          Retry
        </Button>
      </Card>
    );
  }

  if (!snapshot) {
    return <p className="text-sm text-muted">Loading analytics from Meta…</p>;
  }

  const { channels, posts, totals, warnings } = snapshot;

  return (
    <div className="space-y-6">
      {warnings.length > 0 ? (
        <Card className="border-amber-200 bg-amber-50/80">
          <CardTitle className="text-base">Notes</CardTitle>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Metrics from your connected Facebook Pages via Meta Graph API.</p>
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => void refresh()}>
          {pending ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardTitle className="text-base">Published</CardTitle>
          <p className="mt-2 text-3xl font-bold">{formatNumber(totals.publishedPosts)}</p>
          <CardDescription>Posts sent through SocialBD</CardDescription>
        </Card>
        <Card>
          <CardTitle className="text-base">Engagement</CardTitle>
          <p className="mt-2 text-3xl font-bold">{formatNumber(totals.engagement)}</p>
          <CardDescription>Reactions + comments + shares (recent)</CardDescription>
        </Card>
        <Card>
          <CardTitle className="text-base">Impressions</CardTitle>
          <p className="mt-2 text-3xl font-bold">{formatNumber(totals.impressions)}</p>
          <CardDescription>Lifetime on loaded posts</CardDescription>
        </Card>
        <Card>
          <CardTitle className="text-base">Comments</CardTitle>
          <p className="mt-2 text-3xl font-bold">{formatNumber(totals.comments)}</p>
          <CardDescription>On recent published posts</CardDescription>
        </Card>
      </section>

      {channels.length > 0 ? (
        <Card>
          <CardTitle>Channels</CardTitle>
          <CardDescription>Per connected Page</CardDescription>
          <ul className="mt-4 space-y-3">
            {channels.map((channel) => (
              <li
                key={channel.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span>
                  <span className="font-medium">{channel.displayName}</span>
                  <span className="ml-2 text-muted">{getPlatformLabel(channel.platform)}</span>
                </span>
                <span className="text-muted">
                  {channel.error
                    ? channel.error
                    : `${formatNumber(channel.followers)} followers · ${channel.publishedPosts} published`}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card>
        <CardTitle>Recent published posts</CardTitle>
        <CardDescription>Last {posts.length} posts with engagement from Meta</CardDescription>
        {posts.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Publish posts from Composer to see metrics here.</p>
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
                    <span>{formatNumber(post.reactions)} reactions</span>
                    <span>{formatNumber(post.comments)} comments</span>
                    <span>{formatNumber(post.shares)} shares</span>
                    <span>{formatNumber(post.impressions)} impressions</span>
                    <span className="font-medium text-foreground">
                      {formatNumber(post.engagement)} total engagement
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
