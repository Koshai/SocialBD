"use client";

import type { PostSnapshot } from "@/lib/posts-api";
import { usePostsSnapshot } from "@/hooks/use-posts-snapshot";
import { usePreferences } from "@/components/preferences/preferences-provider";

import { PostListView } from "./post-list-view";

type PostListLiveProps = {
  initial: PostSnapshot;
};

export function PostListLive({ initial }: PostListLiveProps) {
  const { t } = usePreferences();
  const { snapshot, isPolling } = usePostsSnapshot(initial);

  return (
    <PostListView
      posts={snapshot.posts}
      isPolling={isPolling}
      description={t("posts.recentShortDesc")}
      footerLink={{
        href: "/dashboard/posts",
        label: t("posts.viewAllHistory"),
      }}
    />
  );
}
