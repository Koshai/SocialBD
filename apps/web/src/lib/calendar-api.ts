import type { CalendarPost } from "@socialbd/db";

export type CalendarSnapshotJson = {
  posts: Array<{
    id: string;
    body: string;
    status: string;
    scheduledAt: string | null;
    publishedAt: string | null;
    createdAt: string;
    channelName: string;
    platform: string;
    displayAt: string;
  }>;
  scheduledCount: number;
};

export function serializeCalendarPosts(posts: CalendarPost[], scheduledCount: number): CalendarSnapshotJson {
  return {
    scheduledCount,
    posts: posts.map((post) => ({
      id: post.id,
      body: post.body,
      status: post.status,
      scheduledAt: post.scheduledAt?.toISOString() ?? null,
      publishedAt: post.publishedAt?.toISOString() ?? null,
      createdAt: post.createdAt.toISOString(),
      channelName: post.channelName,
      platform: post.platform,
      displayAt: post.displayAt.toISOString(),
    })),
  };
}

export function parseCalendarPosts(json: CalendarSnapshotJson): {
  posts: CalendarPost[];
  scheduledCount: number;
} {
  return {
    scheduledCount: json.scheduledCount,
    posts: json.posts.map((post) => ({
      id: post.id,
      body: post.body,
      status: post.status as CalendarPost["status"],
      scheduledAt: post.scheduledAt ? new Date(post.scheduledAt) : null,
      publishedAt: post.publishedAt ? new Date(post.publishedAt) : null,
      createdAt: new Date(post.createdAt),
      channelName: post.channelName,
      platform: post.platform,
      displayAt: new Date(post.displayAt),
    })),
  };
}
