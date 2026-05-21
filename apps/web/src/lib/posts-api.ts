import type { PostWithChannel } from "@socialbd/db";

export type PostSnapshot = {
  posts: PostWithChannel[];
  scheduledCount: number;
  pendingApprovalCount: number;
};

export type PostSnapshotJson = {
  posts: Array<{
    id: string;
    body: string;
    hasMedia: boolean;
    status: string;
    scheduledAt: string | null;
    publishedAt: string | null;
    createdAt: string;
    channelName: string;
    platform: string;
  }>;
  scheduledCount: number;
  pendingApprovalCount: number;
};

export function serializePostSnapshot(snapshot: PostSnapshot): PostSnapshotJson {
  return {
    scheduledCount: snapshot.scheduledCount,
    pendingApprovalCount: snapshot.pendingApprovalCount,
    posts: snapshot.posts.map((post) => ({
      id: post.id,
      body: post.body,
      hasMedia: post.hasMedia,
      status: post.status,
      scheduledAt: post.scheduledAt?.toISOString() ?? null,
      publishedAt: post.publishedAt?.toISOString() ?? null,
      createdAt: post.createdAt.toISOString(),
      channelName: post.channelName,
      platform: post.platform,
    })),
  };
}

export function parsePostSnapshot(json: PostSnapshotJson): PostSnapshot {
  return {
    scheduledCount: json.scheduledCount,
    pendingApprovalCount: json.pendingApprovalCount ?? 0,
    posts: json.posts.map((post) => ({
      id: post.id,
      body: post.body,
      hasMedia: post.hasMedia ?? false,
      status: post.status as PostWithChannel["status"],
      scheduledAt: post.scheduledAt ? new Date(post.scheduledAt) : null,
      publishedAt: post.publishedAt ? new Date(post.publishedAt) : null,
      createdAt: new Date(post.createdAt),
      channelName: post.channelName,
      platform: post.platform,
    })),
  };
}

export function snapshotHasPendingPublish(snapshot: PostSnapshot) {
  return snapshot.scheduledCount > 0 || snapshot.posts.some((post) => post.status === "scheduled");
}
