"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, CardDescription, CardTitle } from "@socialbd/ui";
import type { CalendarPost } from "@socialbd/db";

import {
  addWeeks,
  endOfWeek,
  getWeekDays,
  isSameCalendarDay,
  startOfWeek,
  toDateInputValue,
} from "@/lib/calendar";
import {
  parseCalendarPosts,
  type CalendarSnapshotJson,
} from "@/lib/calendar-api";
import { usePreferences } from "@/components/preferences/preferences-provider";
import { getPostStatusLabel } from "@/lib/i18n/post-status";
import { getPlatformLabel } from "@/lib/platform-labels";

const POLL_INTERVAL_MS = 4_000;

type CalendarWeekProps = {
  initialWeekStart: string;
  initialPosts: CalendarPost[];
  initialScheduledCount: number;
};

function formatDayHeader(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function statusColor(status: CalendarPost["status"]) {
  switch (status) {
    case "published":
      return "border-emerald-200 bg-emerald-50";
    case "failed":
      return "border-red-200 bg-red-50";
    case "scheduled":
      return "border-primary/30 bg-primary/5";
    default:
      return "border-border bg-surface";
  }
}

export function CalendarWeek({
  initialWeekStart,
  initialPosts,
  initialScheduledCount,
}: CalendarWeekProps) {
  const { t } = usePreferences();
  const [weekStart, setWeekStart] = useState(() => new Date(initialWeekStart));
  const [posts, setPosts] = useState(initialPosts);
  const [scheduledCount, setScheduledCount] = useState(initialScheduledCount);
  const [isPolling, setIsPolling] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CalendarPost | null>(null);
  const [rescheduleAt, setRescheduleAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const rangeEnd = useMemo(() => endOfWeek(weekStart), [weekStart]);

  const weekLabel = useMemo(() => {
    const end = weekDays[6];
    if (!end) return "";
    const formatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
    return `${formatter.format(weekDays[0])} – ${formatter.format(end)}`;
  }, [weekDays]);

  const hasScheduled = scheduledCount > 0 || posts.some((post) => post.status === "scheduled");

  const fetchWeek = useCallback(async () => {
    const from = weekStart.toISOString();
    const to = rangeEnd.toISOString();
    const response = await fetch(`/api/posts/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, {
      cache: "no-store",
    });
    if (!response.ok) return;
    const json = (await response.json()) as CalendarSnapshotJson;
    const parsed = parseCalendarPosts(json);
    setPosts(parsed.posts);
    setScheduledCount(parsed.scheduledCount);
  }, [weekStart, rangeEnd]);

  useEffect(() => {
    void fetchWeek();
  }, [fetchWeek]);

  useEffect(() => {
    if (!hasScheduled) return;

    let cancelled = false;

    async function tick() {
      setIsPolling(true);
      try {
        await fetchWeek();
      } finally {
        if (!cancelled) setIsPolling(false);
      }
    }

    void tick();
    const intervalId = window.setInterval(() => void tick(), POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [hasScheduled, fetchWeek]);

  function openReschedule(post: CalendarPost) {
    if (post.status !== "scheduled" && post.status !== "failed") return;
    setSelectedPost(post);
    setRescheduleAt(toDateInputValue(post.scheduledAt ?? post.displayAt));
    setError(null);
  }

  async function handleReschedule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPost) return;

    setPending(true);
    setError(null);

    const response = await fetch(`/api/posts/${selectedPost.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt: new Date(rescheduleAt).toISOString() }),
    });

    const data = (await response.json()) as { error?: string };
    setPending(false);

    if (!response.ok) {
      setError(data.error ?? t("calendar.couldNotReschedule"));
      return;
    }

    setSelectedPost(null);
    await fetchWeek();
  }

  const postsByDay = useMemo(() => {
    return weekDays.map((day) => ({
      day,
      posts: posts.filter((post) => isSameCalendarDay(post.displayAt, day)),
    }));
  }, [weekDays, posts]);

  const isCurrentWeek = isSameCalendarDay(startOfWeek(new Date()), weekStart);

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t("calendar.title")}</CardTitle>
            <CardDescription>
              {weekLabel}
              {scheduledCount > 0
                ? t("calendar.scheduledInQueue", { count: scheduledCount })
                : t("calendar.noScheduledInQueue")}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isPolling ? (
              <span className="text-xs font-medium text-primary" aria-live="polite">
                {t("common.updating")}
              </span>
            ) : null}
            <Button type="button" variant="outline" size="sm" onClick={() => setWeekStart(addWeeks(weekStart, -1))}>
              {t("calendar.previous")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isCurrentWeek}
              onClick={() => setWeekStart(startOfWeek(new Date()))}
            >
              {t("calendar.thisWeek")}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setWeekStart(addWeeks(weekStart, 1))}>
              {t("calendar.next")}
            </Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {postsByDay.map(({ day, posts: dayPosts }) => (
            <div
              key={day.toISOString()}
              className="min-h-[8rem] rounded-xl border border-border bg-background/50 p-2"
            >
              <p className="mb-2 text-xs font-semibold text-muted">{formatDayHeader(day)}</p>
              <ul className="space-y-2">
                {dayPosts.length === 0 ? (
                  <li className="text-xs text-muted">—</li>
                ) : (
                  dayPosts.map((post) => (
                    <li key={post.id}>
                      <button
                        type="button"
                        onClick={() => openReschedule(post)}
                        disabled={post.status !== "scheduled" && post.status !== "failed"}
                        className={`w-full rounded-lg border px-2 py-1.5 text-left text-xs transition-colors ${statusColor(post.status)} ${
                          post.status === "scheduled" || post.status === "failed"
                            ? "hover:opacity-90 cursor-pointer"
                            : "cursor-default"
                        }`}
                      >
                        <span className="block font-medium">{getPostStatusLabel(post.status, t)}</span>
                        <span className="block text-muted">{formatTime(post.displayAt)}</span>
                        <span className="mt-1 line-clamp-2">{post.body}</span>
                        <span className="mt-1 block text-[10px] text-muted">
                          {post.channelName} · {getPlatformLabel(post.platform, t)}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {selectedPost ? (
        <Card>
          <CardTitle>{t("calendar.rescheduleTitle")}</CardTitle>
          <CardDescription className="line-clamp-2">{selectedPost.body}</CardDescription>
          <form className="mt-4 space-y-4" onSubmit={handleReschedule}>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">{t("calendar.newTime")}</span>
              <input
                type="datetime-local"
                value={rescheduleAt}
                onChange={(e) => setRescheduleAt(e.target.value)}
                required
                className="h-10 w-full max-w-xs rounded-lg border border-border bg-background px-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              />
            </label>
            {error ? (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}
            <div className="flex gap-3">
              <Button type="submit" disabled={pending}>
                {pending ? t("composer.saving") : t("calendar.saveNewTime")}
              </Button>
              <Button type="button" variant="outline" onClick={() => setSelectedPost(null)}>
                {t("common.cancel")}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
