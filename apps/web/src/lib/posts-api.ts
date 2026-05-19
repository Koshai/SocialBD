import type { PostWithChannel } from "@socialbd/db";

export type PostSnapshot = {
  posts: PostWithChannel[];
  scheduledCount: number;
};

export type PostSnapshotJson = {
  posts: Array<{
    id: string;
    body: string;
    status: string;
    scheduledAt: string | null;
    publishedAt: string | null;
    createdAt: string;
    channelName: string;
    platform: string;
  }>;
  scheduledCount: number;
};

export function serializePostSnapshot(snapshot: PostSnapshot): PostSnapshotJson {
  return {
    scheduledCount: snapshot.scheduledCount,
    posts: snapshot.posts.map((post) => ({
      id: post.id,
      body: post.body,
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
    posts: json.posts.map((post) => ({
      id: post.id,
      body: post.body,
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
