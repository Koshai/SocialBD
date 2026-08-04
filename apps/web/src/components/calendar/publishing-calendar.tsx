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
} from "@/lib/calendar";
import {
  filterPostsForCopy,
  toClipboardItems,
  type CalendarClipboard,
} from "@/lib/calendar-clipboard";
import {
  parseCalendarPosts,
  type CalendarSnapshotJson,
} from "@/lib/calendar-api";
import { usePreferences } from "@/components/preferences/preferences-provider";
import { PostDetailModal, type PostDetailJson } from "@/components/posts/post-detail-modal";
import { getPostStatusLabel } from "@/lib/i18n/post-status";
import { getPlatformLabel } from "@/lib/platform-labels";

const POLL_INTERVAL_MS = 15_000;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

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
  const [viewPostId, setViewPostId] = useState<string | null>(null);
  const [excludeWeekends, setExcludeWeekends] = useState(false);
  const [clipboard, setClipboard] = useState<CalendarClipboard | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pastePending, setPastePending] = useState(false);

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

  // Skip first fetch when still on the SSR week (avoids double-load). Refetch on range/view change.
  const [rangeReady, setRangeReady] = useState(false);
  useEffect(() => {
    if (!rangeReady) {
      const ssrWeek = new Date(initialWeekStart).getTime();
      const stillSsrWeek =
        view === "week" && Math.abs(startOfWeek(anchor).getTime() - ssrWeek) < 1000;
      setRangeReady(true);
      if (stillSsrWeek) return;
    }
    void fetchRange();
  }, [fetchRange, rangeReady, view, anchor, initialWeekStart]);

  useEffect(() => {
    if (!hasScheduled) return;

    let cancelled = false;

    async function tick() {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      setIsPolling(true);
      try {
        await fetchRange();
      } finally {
        if (!cancelled) setIsPolling(false);
      }
    }

    const intervalId = window.setInterval(() => void tick(), POLL_INTERVAL_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void tick();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [hasScheduled, fetchRange]);

  function copyPosts(sourcePosts: CalendarPost[], sourceView: CalendarView) {
    const items = toClipboardItems(sourcePosts);
    setClipboard({ items, sourceView });
    setBanner(
      items.length === 1
        ? t("calendar.pasteOnDayHint")
        : t("calendar.copiedCount", { count: items.length }),
    );
    setError(null);
  }

  function copyCurrentPeriod() {
    const selected = filterPostsForCopy(posts, range, excludeWeekends);
    copyPosts(selected, view);
  }

  function copySingleFromDetail(post: PostDetailJson) {
    const displayAt = post.scheduledAt ?? post.publishedAt ?? post.createdAt;
    setClipboard({
      items: [{ postId: post.id, displayAt }],
      sourceView: view,
    });
    setBanner(t("calendar.pasteOnDayHint"));
    setError(null);
    setViewPostId(null);
  }

  async function pasteToDay(day: Date) {
    if (!clipboard || clipboard.items.length !== 1) return;

    setPastePending(true);
    setError(null);

    const response = await fetch("/api/posts/duplicate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postIds: clipboard.items.map((item) => item.postId),
        targetDate: day.toISOString(),
      }),
    });
    const data = (await response.json()) as { createdCount?: number; error?: string };
    setPastePending(false);

    if (!response.ok) {
      setError(data.error ?? t("calendar.couldNotPaste"));
      return;
    }

    setBanner(t("calendar.pastedCount", { count: data.createdCount ?? 0 }));
    setClipboard(null);
    await fetchRange();
  }

  async function pasteToNextPeriod() {
    if (!clipboard || clipboard.items.length === 0) {
      setError(t("calendar.clipboardEmpty"));
      return;
    }

    setPastePending(true);
    setError(null);

    const payload =
      view === "week"
        ? { postIds: clipboard.items.map((item) => item.postId), shiftMs: WEEK_MS }
        : { postIds: clipboard.items.map((item) => item.postId), shiftMonths: 1 };

    const response = await fetch("/api/posts/duplicate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { createdCount?: number; error?: string };
    setPastePending(false);

    if (!response.ok) {
      setError(data.error ?? t("calendar.couldNotPaste"));
      return;
    }

    setBanner(t("calendar.pastedCount", { count: data.createdCount ?? 0 }));
    setClipboard(null);
    setAnchor((current) => (view === "week" ? addWeeks(current, 1) : addMonths(current, 1)));
    await fetchRange();
  }

  const canPasteOnDay = Boolean(clipboard?.items.length === 1) && !pastePending;

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
        onClick={(event) => {
          event.stopPropagation();
          setViewPostId(post.id);
        }}
        className={`w-full cursor-pointer rounded-lg border px-2 py-1.5 text-left text-xs transition-colors hover:opacity-90 ${statusColor(post.status)}`}
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

  function renderDayCell(day: Date, options: { compact?: boolean; inMonth?: boolean; isToday?: boolean }) {
    const dayPosts = postsForDay(day);
    const { compact = false, inMonth = true, isToday = false } = options;
    const pasteable = canPasteOnDay;

    return (
      <div
        key={day.toISOString()}
        role={pasteable ? "button" : undefined}
        tabIndex={pasteable ? 0 : undefined}
        onClick={() => {
          if (pasteable) void pasteToDay(day);
        }}
        onKeyDown={(event) => {
          if (!pasteable) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            void pasteToDay(day);
          }
        }}
        title={pasteable ? t("calendar.pasteOnDay") : undefined}
        className={`min-h-[7.5rem] rounded-xl border p-2 transition-colors ${
          inMonth ? "border-border bg-background/50" : "border-border/60 bg-muted/20 opacity-60"
        } ${isToday ? "ring-1 ring-primary/40" : ""} ${
          pasteable
            ? "cursor-pointer hover:border-primary/50 hover:bg-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            : ""
        } ${compact ? "" : "min-h-[8rem]"}`}
      >
        <p className={`mb-2 text-xs font-semibold ${isToday ? "text-primary" : "text-muted"}`}>
          {compact ? formatMonthDayNumber(day) : formatWeekDayHeader(day)}
          {pasteable ? (
            <span className="ml-1 font-normal text-primary">{t("calendar.pasteOnDay")}</span>
          ) : null}
        </p>
        <ul className={compact ? "space-y-1.5" : "space-y-2"}>
          {compact ? (
            <>
              {dayPosts.slice(0, 3).map((post) => (
                <li key={post.id}>{renderPostButton(post, true)}</li>
              ))}
              {dayPosts.length > 3 ? (
                <li className="text-[10px] font-medium text-muted">
                  {t("calendar.morePosts", { count: dayPosts.length - 3 })}
                </li>
              ) : null}
              {dayPosts.length === 0 ? <li className="text-xs text-muted">—</li> : null}
            </>
          ) : dayPosts.length === 0 ? (
            <li className="text-xs text-muted">—</li>
          ) : (
            dayPosts.map((post) => <li key={post.id}>{renderPostButton(post)}</li>)
          )}
        </ul>
      </div>
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

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={excludeWeekends}
              onChange={(e) => setExcludeWeekends(e.target.checked)}
              className="rounded border-border"
            />
            <span>{t("calendar.excludeWeekends")}</span>
          </label>
          <Button type="button" variant="outline" size="sm" onClick={copyCurrentPeriod}>
            {view === "week" ? t("calendar.copyWeek") : t("calendar.copyMonth")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!clipboard?.items.length || pastePending}
            onClick={() => void pasteToNextPeriod()}
          >
            {pastePending
              ? t("composer.saving")
              : view === "week"
                ? t("calendar.pasteNextWeek")
                : t("calendar.pasteNextMonth")}
          </Button>
          {clipboard?.items.length ? (
            <span className="text-xs text-muted">
              {t("calendar.copiedCount", { count: clipboard.items.length })}
            </span>
          ) : null}
        </div>

        {banner ? (
          <p className="mt-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary" aria-live="polite">
            {banner}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {view === "week" ? (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
            {weekDays.map((day) => renderDayCell(day, { compact: false, inMonth: true }))}
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <div className="grid min-w-[44rem] grid-cols-7 gap-2">
              {weekdayLabels.map((day) => (
                <p key={day.toISOString()} className="px-1 text-xs font-semibold text-muted">
                  {formatWeekdayLabel(day)}
                </p>
              ))}
              {monthDays.map((day) =>
                renderDayCell(day, {
                  compact: true,
                  inMonth: isSameCalendarMonth(day, anchor),
                  isToday: isSameCalendarDay(day, new Date()),
                }),
              )}
            </div>
          </div>
        )}
      </Card>

      <PostDetailModal
        postId={viewPostId}
        onClose={() => setViewPostId(null)}
        onCopy={copySingleFromDetail}
        onRescheduled={() => {
          void fetchRange();
        }}
      />
    </div>
  );
}

/** @deprecated Use PublishingCalendar */
export const CalendarWeek = PublishingCalendar;
