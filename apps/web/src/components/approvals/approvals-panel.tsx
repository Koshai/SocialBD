"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, CardDescription, CardTitle } from "@socialbd/ui";

import type { PostWithChannel } from "@socialbd/db";
import { usePreferences } from "@/components/preferences/preferences-provider";
import { getPostStatusLabel } from "@/lib/i18n/post-status";
import { getPlatformLabel } from "@/lib/platform-labels";

function formatWhen(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

type ApprovalsPanelProps = {
  posts: PostWithChannel[];
  canReview: boolean;
};

export function ApprovalsPanel({ posts, canReview }: ApprovalsPanelProps) {
  const router = useRouter();
  const { t } = usePreferences();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function review(postId: string, action: "approve" | "reject") {
    setError(null);
    setPendingId(postId);

    const response = await fetch(`/api/posts/${postId}/${action}`, { method: "POST" });
    const data = (await response.json()) as { error?: string };

    setPendingId(null);

    if (!response.ok) {
      setError(
        data.error ??
          (action === "approve" ? t("approvals.couldNotApprove") : t("approvals.couldNotReject")),
      );
      return;
    }

    router.refresh();
  }

  if (!canReview) {
    return (
      <Card>
        <CardTitle>{t("approvals.title")}</CardTitle>
        <CardDescription>{t("approvals.noAccessDesc")}</CardDescription>
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle>{t("approvals.pendingTitle")}</CardTitle>
      <CardDescription>{t("approvals.pendingDesc")}</CardDescription>

      {error ? (
        <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {posts.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{t("approvals.empty")}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {posts.map((post) => (
            <li key={post.id} className="rounded-lg border border-border px-3 py-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  <span className="font-medium">{post.channelName}</span>
                  <span className="ml-2 text-xs text-muted">{getPlatformLabel(post.platform, t)}</span>
                </span>
                <span className="text-xs text-muted">{formatWhen(post.createdAt)}</span>
              </div>
              <p className="mt-2 line-clamp-3 whitespace-pre-wrap">{post.body}</p>
              {post.scheduledAt ? (
                <p className="mt-1 text-xs text-amber-700">
                  {t("approvals.requestedSchedule", { when: formatWhen(post.scheduledAt) })}
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted">{t("approvals.publishWhenApproved")}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={pendingId === post.id}
                  onClick={() => void review(post.id, "approve")}
                >
                  {pendingId === post.id ? t("common.working") : t("approvals.approve")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pendingId === post.id}
                  onClick={() => void review(post.id, "reject")}
                >
                  {t("approvals.reject")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
