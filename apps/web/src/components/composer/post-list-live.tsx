"use client";

import type { PostSnapshot } from "@/lib/posts-api";
import { usePostsSnapshot } from "@/hooks/use-posts-snapshot";

import { PostListView } from "./post-list-view";

type PostListLiveProps = {
  initial: PostSnapshot;
};

export function PostListLive({ initial }: PostListLiveProps) {
  const { snapshot, isPolling } = usePostsSnapshot(initial);

  return <PostListView posts={snapshot.posts} isPolling={isPolling} />;
}
