"use client";

import { useEffect, useId, useState } from "react";
import { Button } from "@socialbd/ui";
import Link from "next/link";

import { usePreferences } from "@/components/preferences/preferences-provider";
import { FacebookBoostLink } from "@/components/composer/facebook-boost-link";
import { getPostStatusLabel } from "@/lib/i18n/post-status";
import { getPlatformLabel } from "@/lib/platform-labels";
import { toDateInputValue } from "@/lib/calendar";

export type PostDetailJson = {
  id: string;
  body: string;
  mediaPath: string | null;
  mediaMimeType: string | null;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  connectedAccountId: string;
  channelName: string;
  platform: string;
  externalPostId: string | null;
  pageId: string;
  canEdit: boolean;
  canReschedule: boolean;
  previewUrl: string | null;
  hasMedia: boolean;
};

type PostDetailModalProps = {
  postId: string | null;
  onClose: () => void;
  onCopy?: (post: PostDetailJson) => void;
  onRescheduled?: () => void;
};

function formatWhen(iso: string | null) {
  if (!iso) return null;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function PostDetailModal({
  postId,
  onClose,
  onCopy,
  onRescheduled,
}: PostDetailModalProps) {
  const { t } = usePreferences();
  const titleId = useId();
  const [post, setPost] = useState<PostDetailJson | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rescheduleAt, setRescheduleAt] = useState("");
  const [reschedulePending, setReschedulePending] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) {
      setPost(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setRescheduleError(null);

    void (async () => {
      const response = await fetch(`/api/posts/${postId}`, { cache: "no-store" });
      const data = (await response.json()) as { post?: PostDetailJson; error?: string };
      if (cancelled) return;
      setLoading(false);
      if (!response.ok || !data.post) {
        setError(data.error ?? t("posts.couldNotLoadDetail"));
        setPost(null);
        return;
      }
      setPost(data.post);
      if (data.post.scheduledAt) {
        setRescheduleAt(toDateInputValue(new Date(data.post.scheduledAt)));
      } else {
        setRescheduleAt(toDateInputValue(new Date(data.post.createdAt)));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [postId, t]);

  useEffect(() => {
    if (!postId) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [postId, onClose]);

  if (!postId) return null;

  async function handleReschedule(event: React.FormEvent) {
    event.preventDefault();
    if (!post) return;
    setReschedulePending(true);
    setRescheduleError(null);

    const response = await fetch(`/api/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt: new Date(rescheduleAt).toISOString() }),
    });
    const data = (await response.json()) as { error?: string };
    setReschedulePending(false);

    if (!response.ok) {
      setRescheduleError(data.error ?? t("calendar.couldNotReschedule"));
      return;
    }

    onRescheduled?.();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-lg font-semibold">
            {t("posts.viewTitle")}
          </h2>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            {t("posts.closeDetails")}
          </Button>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-muted">{t("auth.loading")}</p>
        ) : null}

        {error ? (
          <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {post ? (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-medium">{getPostStatusLabel(post.status, t)}</span>
              <span className="text-muted">
                {post.channelName} · {getPlatformLabel(post.platform, t)}
              </span>
            </div>

            {post.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.previewUrl}
                alt=""
                className="max-h-72 w-full rounded-xl border border-border object-contain bg-background"
              />
            ) : null}

            <p className="whitespace-pre-wrap text-sm">
              {post.body || (post.hasMedia ? t("common.imagePost") : "—")}
            </p>

            <dl className="space-y-1 text-xs text-muted">
              {post.scheduledAt ? (
                <div>
                  <dt className="inline font-medium text-foreground">{t("posts.scheduledAt", {
                    when: formatWhen(post.scheduledAt) ?? "",
                  })}</dt>
                </div>
              ) : null}
              {post.publishedAt ? (
                <div>
                  <dt className="inline font-medium text-foreground">{t("posts.publishedAt", {
                    when: formatWhen(post.publishedAt) ?? "",
                  })}</dt>
                </div>
              ) : null}
              <div>
                <dt className="inline">
                  {t("posts.createdAt", { when: formatWhen(post.createdAt) ?? "" })}
                </dt>
              </div>
            </dl>

            {post.status === "failed" ? (
              <p className="text-xs text-red-600">{t("posts.failedHint")}</p>
            ) : null}

            <FacebookBoostLink
              platform={post.platform}
              status={post.status}
              pageId={post.pageId}
              externalPostId={post.externalPostId}
            />

            <div className="flex flex-wrap gap-2">
              {post.canEdit ? (
                <Link
                  href={`/dashboard/composer?postId=${post.id}`}
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
                >
                  {t("posts.editPost")}
                </Link>
              ) : null}
              {onCopy ? (
                <Button type="button" variant="outline" onClick={() => onCopy(post)}>
                  {t("calendar.copyPost")}
                </Button>
              ) : null}
            </div>

            {post.canReschedule ? (
              <form className="space-y-3 border-t border-border pt-4" onSubmit={handleReschedule}>
                <p className="text-sm font-medium">{t("calendar.rescheduleTitle")}</p>
                <label className="block space-y-1 text-sm">
                  <span className="font-medium">{t("calendar.newTime")}</span>
                  <input
                    type="datetime-local"
                    value={rescheduleAt}
                    onChange={(e) => setRescheduleAt(e.target.value)}
                    required
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  />
                </label>
                {rescheduleError ? (
                  <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {rescheduleError}
                  </p>
                ) : null}
                <Button type="submit" disabled={reschedulePending}>
                  {reschedulePending ? t("composer.saving") : t("calendar.saveNewTime")}
                </Button>
              </form>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
