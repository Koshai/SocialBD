import Link from "next/link";
import type { PostWithChannel } from "@socialbd/db";
import { Card, CardDescription, CardTitle } from "@socialbd/ui";

import { getPlatformLabel } from "@/lib/platform-labels";
import { getPostStatusLabel } from "@/lib/i18n/post-status";
import type { TranslateFn } from "@/lib/i18n/translate";

function formatWhen(value: Date | null, fallback: string) {
  if (!value) return fallback;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function truncateBody(body: string, max = 100) {
  const text = body.replace(/\s+/g, " ").trim();
  if (!text) return "—";
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

type DashboardPostListCardProps = {
  title: string;
  description: string;
  empty: string;
  viewAllHref: string;
  viewAllLabel: string;
  posts: PostWithChannel[];
  t: TranslateFn;
  /** Prefer scheduled time when present. */
  timeField?: "scheduledAt" | "createdAt";
  editComposer?: boolean;
};

export function DashboardPostListCard({
  title,
  description,
  empty,
  viewAllHref,
  viewAllLabel,
  posts,
  t,
  timeField = "createdAt",
  editComposer = false,
}: DashboardPostListCardProps) {
  return (
    <Card className="flex h-full flex-col">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Link
          href={viewAllHref}
          className="text-xs font-medium text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {viewAllLabel}
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="mt-4 flex-1 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="mt-4 flex-1 space-y-3">
          {posts.map((post) => {
            const when =
              timeField === "scheduledAt"
                ? formatWhen(post.scheduledAt, t("dashboard.timeUnset"))
                : formatWhen(post.createdAt, t("dashboard.timeUnset"));
            const href = editComposer
              ? `/dashboard/composer?postId=${encodeURIComponent(post.id)}`
              : viewAllHref;

            return (
              <li key={post.id}>
                <Link
                  href={href}
                  className="block rounded-xl border border-border px-3 py-3 transition-colors hover:border-primary/30 hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                    <span>
                      {getPlatformLabel(post.platform, t)} · {post.channelName}
                    </span>
                    <span>{when}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-foreground line-clamp-2">{truncateBody(post.body)}</p>
                  <p className="mt-1 text-xs font-medium text-muted">
                    {getPostStatusLabel(post.status, t)}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
