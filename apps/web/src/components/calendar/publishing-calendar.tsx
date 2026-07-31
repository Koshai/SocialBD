"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, CardDescription, CardTitle } from "@socialbd/ui";
import type { CalendarPost } from "@socialbd/db";

import {
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  getMonthGridDays,
  getWeekDays,
  isSameCalendarDay,
  isSameCalendarMonth,
  startOfMonth,
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

type CalendarView = "week" | "month";

type PublishingCalendarProps = {
  initialWeekStart: string;
  initialPosts: CalendarPost[];
  initialScheduledCount: number;
};

function formatWeekDayHeader(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatMonthDayNumber(date: Date) {
  return new Intl.DateTimeFormat(undefined, { day: "numeric" }).format(date);
}

function formatWeekdayLabel(date: Date) {
  return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date);
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

export function PublishingCalendar({
  initialWeekStart,
  initialPosts,
  initialScheduledCount,
}: PublishingCalendarProps) {
  const { t } = usePreferences();
  const [view, setView] = useState<CalendarView>("week");
  const [anchor, setAnchor] = useState(() => new Date(initialWeekStart));
  const [posts, setPosts] = useState(initialPosts);
  const [scheduledCount, setScheduledCount] = useState(initialScheduledCount);
  const [isPolling, setIsPolling] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CalendarPost | null>(null);
  const [rescheduleAt, setRescheduleAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const range = useMemo(() => {
    if (view === "week") {
      const from = startOfWeek(anchor);
      return { from, to: endOfWeek(from) };
    }
    const month = startOfMonth(anchor);
    return {
      from: startOfWeek(month),
      to: endOfWeek(endOfMonth(month)),
    };
  }, [view, anchor]);

  const weekDays = useMemo(() => getWeekDays(startOfWeek(anchor)), [anchor]);
  const monthDays = useMemo(() => getMonthGridDays(anchor), [anchor]);
  const weekdayLabels = useMemo(() => getWeekDays(startOfWeek(new Date())), []);

  const rangeLabel = useMemo(() => {
    if (view === "week") {
      const days = getWeekDays(startOfWeek(anchor));
      const end = days[6];
      if (!end) return "";
      const formatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
      return `${formatter.format(days[0])} – ${formatter.format(end)}`;
    }
    return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(anchor);
  }, [view, anchor]);

  const hasScheduled = scheduledCount > 0 || posts.some((post) => post.status === "scheduled");

  const fetchRange = useCallback(async () => {
    const from = range.from.toISOString();
    const to = range.to.toISOString();
    const response = await fetch(
      `/api/posts/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      { cache: "no-store" },
    );
    if (!response.ok) return;
    const json = (await response.json()) as CalendarSnapshotJson;
    const parsed = parseCalendarPosts(json);
    setPosts(parsed.posts);
    setScheduledCount(parsed.scheduledCount);
  }, [range.from, range.to]);

  useEffect(() => {
    void fetchRange();
  }, [fetchRange]);

  useEffect(() => {
    if (!hasScheduled) return;

    let cancelled = false;

    async function tick() {
      setIsPolling(true);
      try {
        await fetchRange();
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
  }, [hasScheduled, fetchRange]);

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
    await fetchRange();
  }

  function goPrevious() {
    setAnchor((current) => (view === "week" ? addWeeks(current, -1) : addMonths(current, -1)));
  }

  function goNext() {
    setAnchor((current) => (view === "week" ? addWeeks(current, 1) : addMonths(current, 1)));
  }

  function goToday() {
    setAnchor(view === "week" ? startOfWeek(new Date()) : startOfMonth(new Date()));
  }

  const isCurrentPeriod =
    view === "week"
      ? isSameCalendarDay(startOfWeek(new Date()), startOfWeek(anchor))
      : isSameCalendarMonth(new Date(), anchor);

  function postsForDay(day: Date) {
    return posts.filter((post) => isSameCalendarDay(post.displayAt, day));
  }

  function renderPostButton(post: CalendarPost, compact = false) {
    return (
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
        {!compact ? <span className="mt-1 line-clamp-2">{post.body}</span> : null}
        <span className={`block text-[10px] text-muted ${compact ? "" : "mt-1"}`}>
          {post.channelName} · {getPlatformLabel(post.platform, t)}
        </span>
        {compact ? <span className="mt-0.5 line-clamp-1">{post.body}</span> : null}
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>{t("calendar.title")}</CardTitle>
            <CardDescription>
              {rangeLabel}
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
            <div className="flex rounded-lg border border-border p-0.5">
              <Button
                type="button"
                variant={view === "week" ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setView("week");
                  setAnchor(startOfWeek(anchor));
                }}
              >
                {t("calendar.viewWeek")}
              </Button>
              <Button
                type="button"
                variant={view === "month" ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setView("month");
                  setAnchor(startOfMonth(anchor));
                }}
              >
                {t("calendar.viewMonth")}
              </Button>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={goPrevious}>
              {t("calendar.previous")}
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={isCurrentPeriod} onClick={goToday}>
              {view === "week" ? t("calendar.thisWeek") : t("calendar.thisMonth")}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={goNext}>
              {t("calendar.next")}
            </Button>
          </div>
        </div>

        {view === "week" ? (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
            {weekDays.map((day) => {
              const dayPosts = postsForDay(day);
              return (
                <div
                  key={day.toISOString()}
                  className="min-h-[8rem] rounded-xl border border-border bg-background/50 p-2"
                >
                  <p className="mb-2 text-xs font-semibold text-muted">{formatWeekDayHeader(day)}</p>
                  <ul className="space-y-2">
                    {dayPosts.length === 0 ? (
                      <li className="text-xs text-muted">—</li>
                    ) : (
                      dayPosts.map((post) => <li key={post.id}>{renderPostButton(post)}</li>)
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <div className="grid min-w-[44rem] grid-cols-7 gap-2">
              {weekdayLabels.map((day) => (
                <p key={day.toISOString()} className="px-1 text-xs font-semibold text-muted">
                  {formatWeekdayLabel(day)}
                </p>
              ))}
              {monthDays.map((day) => {
                const inMonth = isSameCalendarMonth(day, anchor);
                const isToday = isSameCalendarDay(day, new Date());
                const dayPosts = postsForDay(day);
                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[7.5rem] rounded-xl border p-2 ${
                      inMonth ? "border-border bg-background/50" : "border-border/60 bg-muted/20 opacity-60"
                    } ${isToday ? "ring-1 ring-primary/40" : ""}`}
                  >
                    <p className={`mb-2 text-xs font-semibold ${isToday ? "text-primary" : "text-muted"}`}>
                      {formatMonthDayNumber(day)}
                    </p>
                    <ul className="space-y-1.5">
                      {dayPosts.slice(0, 3).map((post) => (
                        <li key={post.id}>{renderPostButton(post, true)}</li>
                      ))}
                      {dayPosts.length > 3 ? (
                        <li className="text-[10px] font-medium text-muted">
                          {t("calendar.morePosts", { count: dayPosts.length - 3 })}
                        </li>
                      ) : null}
                      {dayPosts.length === 0 ? <li className="text-xs text-muted">—</li> : null}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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

/** @deprecated Use PublishingCalendar */
export const CalendarWeek = PublishingCalendar;
