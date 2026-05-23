import type { PostStatus, PostStatusCounts, PostWithChannel } from "@socialbd/db";

export type PostSnapshot = {
  posts: PostWithChannel[];
  scheduledCount: number;
  pendingApprovalCount: number;
};

export type PostHistoryFilter = {
  status: PostStatus | "all";
  platform: string | "all";
};

export type PostHistoryCounts = PostStatusCounts;

export type PostHistoryResult = {
  posts: PostWithChannel[];
  counts: PostHistoryCounts;
  nextCursor: string | null;
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
    externalPostId?: string | null;
    pageId?: string | null;
  }>;
  scheduledCount: number;
  pendingApprovalCount: number;
  counts?: PostHistoryCounts;
  nextCursor?: string | null;
  error?: string;
};

function mapPostJson(
  post: PostSnapshotJson["posts"][number],
): PostWithChannel {
  return {
    id: post.id,
    body: post.body,
    hasMedia: post.hasMedia ?? false,
    status: post.status as PostWithChannel["status"],
    scheduledAt: post.scheduledAt ? new Date(post.scheduledAt) : null,
    publishedAt: post.publishedAt ? new Date(post.publishedAt) : null,
    createdAt: new Date(post.createdAt),
    channelName: post.channelName,
    platform: post.platform,
    externalPostId: post.externalPostId ?? null,
    pageId: post.pageId ?? "",
  };
}

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
      externalPostId: post.externalPostId,
      pageId: post.pageId,
    })),
  };
}

export function parsePostSnapshot(json: PostSnapshotJson): PostSnapshot {
  return {
    scheduledCount: json.scheduledCount,
    pendingApprovalCount: json.pendingApprovalCount ?? 0,
    posts: json.posts.map(mapPostJson),
  };
}

export function parsePostHistoryResponse(json: PostSnapshotJson): PostHistoryResult {
  const defaultCounts: PostHistoryCounts = {
    all: 0,
    draft: 0,
    pending_approval: 0,
    scheduled: 0,
    published: 0,
    failed: 0,
    rejected: 0,
  };

  return {
    posts: json.posts.map(mapPostJson),
    counts: { ...defaultCounts, ...json.counts },
    nextCursor: json.nextCursor ?? null,
    scheduledCount: json.scheduledCount,
    pendingApprovalCount: json.pendingApprovalCount ?? 0,
  };
}

export function snapshotHasPendingPublish(snapshot: PostSnapshot) {
  return snapshot.scheduledCount > 0 || snapshot.posts.some((post) => post.status === "scheduled");
}

export function parsePostHistoryFilter(searchParams: URLSearchParams): PostHistoryFilter {
  const statusRaw = searchParams.get("status") ?? "all";
  const platformRaw = searchParams.get("platform") ?? "all";

  const statuses: Array<PostStatus | "all"> = [
    "all",
    "draft",
    "pending_approval",
    "scheduled",
    "published",
    "failed",
    "rejected",
  ];
  const platforms = ["all", "facebook_page", "instagram", "linkedin_organization"];

  return {
    status: statuses.includes(statusRaw as PostStatus | "all")
      ? (statusRaw as PostStatus | "all")
      : "all",
    platform: platforms.includes(platformRaw) ? platformRaw : "all",
  };
}
