"use client";

import { useEffect, useState } from "react";

import {
  parsePostSnapshot,
  snapshotHasPendingPublish,
  type PostSnapshot,
  type PostSnapshotJson,
} from "@/lib/posts-api";

const POLL_INTERVAL_MS = 8_000;

export function usePostsSnapshot(initial: PostSnapshot) {
  const [snapshot, setSnapshot] = useState(initial);
  const [isPolling, setIsPolling] = useState(false);

  const initialKey = `${initial.scheduledCount}:${initial.posts.map((p) => `${p.id}:${p.status}`).join(",")}`;

  useEffect(() => {
    setSnapshot(initial);
  }, [initialKey, initial]);

  const hasPending = snapshotHasPendingPublish(snapshot);

  useEffect(() => {
    if (!hasPending) {
      setIsPolling(false);
      return;
    }

    let cancelled = false;

    async function refresh() {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      setIsPolling(true);
      try {
        const response = await fetch("/api/posts", { cache: "no-store" });
        if (!response.ok || cancelled) return;
        const json = (await response.json()) as PostSnapshotJson;
        if (!cancelled) {
          setSnapshot(parsePostSnapshot(json));
        }
      } finally {
        if (!cancelled) {
          setIsPolling(false);
        }
      }
    }

    void refresh();
    const intervalId = window.setInterval(() => void refresh(), POLL_INTERVAL_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [hasPending]);

  return { snapshot, isPolling, hasPending };
}
