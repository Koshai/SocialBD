"use client";

import { Card, CardDescription, CardTitle } from "@socialbd/ui";
import type { PostWithChannel } from "@socialbd/db";

import { usePreferences } from "@/components/preferences/preferences-provider";
<<<<<<< HEAD
=======
import { FacebookBoostLink } from "@/components/composer/facebook-boost-link";
>>>>>>> 4d6e2ef9950540f1b3bcc52875ef8b65928e1ff8
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
  emptyMessage?: string;
  title?: string;
  description?: string;
  footerLink?: { href: string; label: string };
};

export function PostListView({
  posts,
  isPolling = false,
  emptyMessage,
  title,
  description,
  footerLink,
}: PostListViewProps) {
  const { t } = usePreferences();

  if (posts.length === 0) {
    if (!emptyMessage) return null;
    return (
      <Card>
        <CardTitle>{title ?? t("posts.recentTitle")}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        <p className="mt-4 text-sm text-muted">{emptyMessage}</p>
        {footerLink ? (
          <p className="mt-3">
            <a href={footerLink.href} className="text-sm font-medium text-primary hover:underline">
              {footerLink.label}
            </a>
          </p>
        ) : null}
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle>{title ?? t("posts.recentTitle")}</CardTitle>
        {isPolling ? (
          <span className="text-xs font-medium text-primary" aria-live="polite">
            {t("common.updating")}
          </span>
        ) : null}
      </div>
      <CardDescription>{description ?? t("posts.recentDesc")}</CardDescription>
      {footerLink ? (
        <p className="mt-1">
          <a href={footerLink.href} className="text-xs font-medium text-primary hover:underline">
            {footerLink.label}
          </a>
        </p>
      ) : null}
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
<<<<<<< HEAD
=======
            <FacebookBoostLink
              platform={item.platform}
              status={item.status}
              externalPostId={item.externalPostId}
              pageId={item.pageId}
            />
>>>>>>> 4d6e2ef9950540f1b3bcc52875ef8b65928e1ff8
          </li>
        ))}
      </ul>
    </Card>
  );
}
