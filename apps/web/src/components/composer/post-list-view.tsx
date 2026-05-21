"use client";

import { Card, CardDescription, CardTitle } from "@socialbd/ui";
import type { PostWithChannel } from "@socialbd/db";

import { usePreferences } from "@/components/preferences/preferences-provider";
import { getPostStatusLabel } from "@/lib/i18n/post-status";
import { getPlatformLabel } from "@/lib/platform-labels";

function formatWhen(date: Date | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

type PostListViewProps = {
  posts: PostWithChannel[];
  isPolling?: boolean;
};

export function PostListView({ posts, isPolling = false }: PostListViewProps) {
  const { t } = usePreferences();

  if (posts.length === 0) {
    return null;
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle>{t("posts.recentTitle")}</CardTitle>
        {isPolling ? (
          <span className="text-xs font-medium text-primary" aria-live="polite">
            {t("common.updating")}
          </span>
        ) : null}
      </div>
      <CardDescription>{t("posts.recentDesc")}</CardDescription>
      <ul className="mt-4 space-y-3">
        {posts.map((item) => (
          <li key={item.id} className="rounded-lg border border-border px-3 py-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span
                className={`font-medium ${
                  item.status === "failed" || item.status === "rejected"
                    ? "text-red-600"
                    : item.status === "published"
                      ? "text-emerald-700"
                      : item.status === "scheduled"
                        ? "text-primary"
                        : item.status === "pending_approval"
                          ? "text-amber-700"
                          : ""
                }`}
              >
                {getPostStatusLabel(item.status, t)}
              </span>
              <span className="text-muted">
                {item.channelName} · {getPlatformLabel(item.platform, t)}
              </span>
            </div>
            <p className="mt-2 line-clamp-3 whitespace-pre-wrap">
              {item.hasMedia ? <span className="mr-2 text-xs text-muted">📷</span> : null}
              {item.body || (item.hasMedia ? t("common.imagePost") : "")}
            </p>
            {item.scheduledAt ? (
              <p className="mt-1 text-xs text-muted">
                {t("posts.scheduledAt", { when: formatWhen(item.scheduledAt) ?? "" })}
              </p>
            ) : null}
            {item.publishedAt ? (
              <p className="mt-1 text-xs text-muted">
                {t("posts.publishedAt", { when: formatWhen(item.publishedAt) ?? "" })}
              </p>
            ) : null}
            {item.status === "failed" ? (
              <p className="mt-2 text-xs text-red-600">{t("posts.failedHint")}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}
