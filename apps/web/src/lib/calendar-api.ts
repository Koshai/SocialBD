import type { CalendarPost } from "@socialbd/db";

export type CalendarSnapshotJson = {
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
<<<<<<< HEAD
=======
    externalPostId?: string | null;
    pageId?: string | null;
>>>>>>> 4d6e2ef9950540f1b3bcc52875ef8b65928e1ff8
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
      hasMedia: post.hasMedia,
      status: post.status,
      scheduledAt: post.scheduledAt?.toISOString() ?? null,
      publishedAt: post.publishedAt?.toISOString() ?? null,
      createdAt: post.createdAt.toISOString(),
      channelName: post.channelName,
      platform: post.platform,
<<<<<<< HEAD
=======
      externalPostId: post.externalPostId,
      pageId: post.pageId,
>>>>>>> 4d6e2ef9950540f1b3bcc52875ef8b65928e1ff8
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
      hasMedia: post.hasMedia ?? false,
      status: post.status as CalendarPost["status"],
      scheduledAt: post.scheduledAt ? new Date(post.scheduledAt) : null,
      publishedAt: post.publishedAt ? new Date(post.publishedAt) : null,
      createdAt: new Date(post.createdAt),
      channelName: post.channelName,
      platform: post.platform,
<<<<<<< HEAD
=======
      externalPostId: post.externalPostId ?? null,
      pageId: post.pageId ?? "",
>>>>>>> 4d6e2ef9950540f1b3bcc52875ef8b65928e1ff8
      displayAt: new Date(post.displayAt),
    })),
  };
}
