"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { Button, Card, CardDescription, CardTitle } from "@socialbd/ui";
import type { PostStatus, PostWithChannel } from "@socialbd/db";

import { usePreferences } from "@/components/preferences/preferences-provider";
import { postHistoryPlatformOptions } from "@/lib/features/linkedin";
import {
  parsePostHistoryResponse,
  type PostHistoryCounts,
  type PostHistoryFilter,
} from "@/lib/posts-api";

import { PostListView } from "./post-list-view";

const STATUS_TABS: Array<{ id: PostHistoryFilter["status"]; labelKey: string }> = [
  { id: "all", labelKey: "posts.filterAll" },
  { id: "published", labelKey: "posts.filterPublished" },
  { id: "scheduled", labelKey: "posts.filterScheduled" },
  { id: "draft", labelKey: "posts.filterDraft" },
  { id: "pending_approval", labelKey: "posts.filterPending" },
  { id: "failed", labelKey: "posts.filterFailed" },
];

const PLATFORM_LABEL_KEYS: Record<string, string> = {
  all: "posts.platformAll",
  facebook_page: "platform.facebookPage",
  instagram: "platform.instagram",
  linkedin_organization: "platform.linkedin",
};

function buildPlatformOptions() {
  return postHistoryPlatformOptions().map((id) => ({
    id,
    labelKey: PLATFORM_LABEL_KEYS[id] ?? "posts.platformAll",
  }));
}

type PostHistoryPanelProps = {
  initialPosts: PostWithChannel[];
  initialCounts: PostHistoryCounts;
  initialNextCursor: string | null;
  initialFilter: PostHistoryFilter;
};

export function PostHistoryPanel({
  initialPosts,
  initialCounts,
  initialNextCursor,
  initialFilter,
}: PostHistoryPanelProps) {
  const { t } = usePreferences();
  const [posts, setPosts] = useState(initialPosts);
  const [counts, setCounts] = useState(initialCounts);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [filter, setFilter] = useState(initialFilter);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusTabs = useMemo(
    () =>
      STATUS_TABS.map((tab) => ({
        ...tab,
        label: t(tab.labelKey),
        count: counts[tab.id] ?? 0,
      })),
    [counts, t],
  );

  const fetchPosts = useCallback(
    async (next: PostHistoryFilter, cursor?: string | null, append = false) => {
      setPending(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("status", next.status);
      params.set("platform", next.platform);
      params.set("limit", "25");
      if (cursor) params.set("cursor", cursor);

      const response = await fetch(`/api/posts?${params.toString()}`, { cache: "no-store" });
      const json = await response.json();

      setPending(false);

      if (!response.ok) {
        setError(typeof json.error === "string" ? json.error : t("posts.couldNotLoad"));
        return;
      }

      const parsed = parsePostHistoryResponse(json);
      setPosts((current) => (append ? [...current, ...parsed.posts] : parsed.posts));
      setCounts(parsed.counts);
      setNextCursor(parsed.nextCursor);
      setFilter(next);
    },
    [t],
  );

  function changeStatus(status: PostHistoryFilter["status"]) {
    if (status === filter.status || pending) return;
    void fetchPosts({ ...filter, status });
  }

  function changePlatform(platform: PostHistoryFilter["platform"]) {
    if (platform === filter.platform || pending) return;
    void fetchPosts({ ...filter, platform });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>{t("posts.historyTitle")}</CardTitle>
        <CardDescription>{t("posts.historyDesc")}</CardDescription>

        <div
          className="mt-4 flex flex-wrap gap-2"
          role="tablist"
          aria-label={t("posts.filterByStatus")}
        >
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={filter.status === tab.id}
              disabled={pending}
              onClick={() => changeStatus(tab.id)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                filter.status === tab.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted/40"
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs opacity-80">({tab.count})</span>
            </button>
          ))}
        </div>

        <label className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium text-muted">{t("posts.filterByPlatform")}</span>
          <select
            value={filter.platform}
            disabled={pending}
            onChange={(e) => changePlatform(e.target.value as PostHistoryFilter["platform"])}
            className="h-9 rounded-lg border border-border bg-background px-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {buildPlatformOptions().map((option) => (
              <option key={option.id} value={option.id}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </label>

        {error ? (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        ) : null}
      </Card>

      <PostListView
        posts={posts}
        isPolling={pending}
        emptyMessage={t("posts.historyEmpty")}
      />

      {nextCursor ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => void fetchPosts(filter, nextCursor, true)}
          >
            {pending ? t("common.working") : t("posts.loadMore")}
          </Button>
        </div>
      ) : null}

      <p className="text-center text-sm text-muted">
        <Link href="/dashboard/composer" className="font-medium text-primary hover:underline">
          {t("posts.backToComposer")}
        </Link>
      </p>
    </div>
  );
}
