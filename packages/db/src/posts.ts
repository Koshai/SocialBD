import { and, desc, eq, gte, inArray, isNotNull, lt, lte, or, sql } from "drizzle-orm";

import { db } from "./db";
import { connectedAccount } from "./schema/connected-account";
import { post } from "./schema/post";

export type PostStatus =
  | "draft"
  | "pending_approval"
  | "scheduled"
  | "published"
  | "failed"
  | "rejected";

export type PostWithChannel = {
  id: string;
  body: string;
  hasMedia: boolean;
  status: PostStatus;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  channelName: string;
  platform: string;
};

export type CalendarPost = PostWithChannel & {
  displayAt: Date;
};

export async function createPost(input: {
  organizationId: string;
  connectedAccountId: string;
  createdByUserId: string;
  body: string;
  mediaPath?: string | null;
  mediaMimeType?: string | null;
  scheduledAt?: Date | null;
  /** When true, saves as pending_approval (for members) instead of publishing/scheduling. */
  submitForApproval?: boolean;
}) {
  const now = new Date();
  const trimmedBody = input.body.trim();
  if (!trimmedBody && !input.mediaPath) {
    throw new Error("Add a caption or an image.");
  }

  const scheduledAt = input.scheduledAt ?? null;
  let status: PostStatus = "draft";

  if (input.submitForApproval) {
    if (scheduledAt && scheduledAt.getTime() <= now.getTime()) {
      throw new Error("Schedule time must be in the future.");
    }
    status = "pending_approval";
  } else if (scheduledAt && scheduledAt.getTime() > now.getTime()) {
    status = "scheduled";
  }

  const [row] = await db
    .insert(post)
    .values({
      id: crypto.randomUUID(),
      organizationId: input.organizationId,
      connectedAccountId: input.connectedAccountId,
      createdByUserId: input.createdByUserId,
      body: trimmedBody,
      mediaPath: input.mediaPath ?? null,
      mediaMimeType: input.mediaMimeType ?? null,
      status,
      scheduledAt: status === "scheduled" ? scheduledAt : null,
      publishedAt: null,
      externalPostId: null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return row;
}

const postListSelect = {
  id: post.id,
  body: post.body,
  hasMedia: sql<boolean>`(${post.mediaPath} IS NOT NULL)`,
  status: post.status,
  scheduledAt: post.scheduledAt,
  publishedAt: post.publishedAt,
  createdAt: post.createdAt,
  channelName: connectedAccount.displayName,
  platform: connectedAccount.platform,
};

export type PostListQuery = {
  organizationId: string;
  status?: PostStatus | "all";
  platform?: string | "all";
  limit?: number;
  cursor?: string;
};

export type PostListResult = {
  posts: PostWithChannel[];
  nextCursor: string | null;
};

export type PostStatusCounts = Record<PostStatus | "all", number>;

function encodePostCursor(row: { createdAt: Date; id: string }) {
  return Buffer.from(
    JSON.stringify({ createdAt: row.createdAt.toISOString(), id: row.id }),
  ).toString("base64url");
}

function decodePostCursor(cursor: string) {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as {
      createdAt: string;
      id: string;
    };
    const createdAt = new Date(parsed.createdAt);
    if (Number.isNaN(createdAt.getTime()) || !parsed.id) {
      return null;
    }
    return { createdAt, id: parsed.id };
  } catch {
    return null;
  }
}

export async function listPostsFiltered(query: PostListQuery): Promise<PostListResult> {
  const limit = Math.min(Math.max(query.limit ?? 20, 1), 50);
  const conditions = [eq(post.organizationId, query.organizationId)];

  if (query.status && query.status !== "all") {
    conditions.push(eq(post.status, query.status));
  }

  if (query.platform && query.platform !== "all") {
    conditions.push(eq(connectedAccount.platform, query.platform));
  }

  if (query.cursor) {
    const decoded = decodePostCursor(query.cursor);
    if (decoded) {
      conditions.push(
        or(
          lt(post.createdAt, decoded.createdAt),
          and(eq(post.createdAt, decoded.createdAt), lt(post.id, decoded.id)),
        )!,
      );
    }
  }

  const rows = await db
    .select(postListSelect)
    .from(post)
    .innerJoin(connectedAccount, eq(post.connectedAccountId, connectedAccount.id))
    .where(and(...conditions))
    .orderBy(desc(post.createdAt), desc(post.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const slice = (hasMore ? rows.slice(0, limit) : rows) as PostWithChannel[];
  const last = slice[slice.length - 1];

  return {
    posts: slice,
    nextCursor: hasMore && last ? encodePostCursor(last) : null,
  };
}

export async function countPostsByStatus(organizationId: string): Promise<PostStatusCounts> {
  const rows = await db
    .select({
      status: post.status,
      count: sql<number>`count(*)::int`,
    })
    .from(post)
    .where(eq(post.organizationId, organizationId))
    .groupBy(post.status);

  const counts: PostStatusCounts = {
    all: 0,
    draft: 0,
    pending_approval: 0,
    scheduled: 0,
    published: 0,
    failed: 0,
    rejected: 0,
  };

  for (const row of rows) {
    const status = row.status as PostStatus;
    counts[status] = row.count;
    counts.all = (counts.all ?? 0) + row.count;
  }

  return counts;
}

export async function listPostsForOrganization(organizationId: string, limit = 20) {
  const { posts } = await listPostsFiltered({
    organizationId,
    status: "all",
    limit,
  });
  return posts;
}

export async function countScheduledPosts(organizationId: string) {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(post)
    .where(and(eq(post.organizationId, organizationId), eq(post.status, "scheduled")));

  return result?.count ?? 0;
}

export async function getConnectedAccountForOrganization(
  connectedAccountId: string,
  organizationId: string,
) {
  const [row] = await db
    .select({ id: connectedAccount.id, platform: connectedAccount.platform })
    .from(connectedAccount)
    .where(
      and(
        eq(connectedAccount.id, connectedAccountId),
        eq(connectedAccount.organizationId, organizationId),
        eq(connectedAccount.status, "active"),
      ),
    )
    .limit(1);

  return row ?? null;
}

export type PostForPublish = {
  id: string;
  body: string;
  mediaPath: string | null;
  mediaMimeType: string | null;
  status: string;
  scheduledAt: Date | null;
  platform: string;
  pageId: string;
  pageAccessToken: string;
};

export async function getPostForPublish(postId: string, organizationId?: string) {
  const conditions = [eq(post.id, postId)];
  if (organizationId) {
    conditions.push(eq(post.organizationId, organizationId));
  }

  const [row] = await db
    .select({
      id: post.id,
      body: post.body,
      mediaPath: post.mediaPath,
      mediaMimeType: post.mediaMimeType,
      status: post.status,
      scheduledAt: post.scheduledAt,
      platform: connectedAccount.platform,
      pageId: connectedAccount.providerAccountId,
      pageAccessToken: connectedAccount.accessToken,
    })
    .from(post)
    .innerJoin(connectedAccount, eq(post.connectedAccountId, connectedAccount.id))
    .where(and(...conditions))
    .limit(1);

  return row ?? null;
}

export async function markPostPublished(postId: string, externalPostId: string) {
  const now = new Date();
  await db
    .update(post)
    .set({
      status: "published",
      publishedAt: now,
      externalPostId,
      updatedAt: now,
    })
    .where(eq(post.id, postId));
}

export async function markPostFailed(postId: string) {
  const now = new Date();
  await db
    .update(post)
    .set({
      status: "failed",
      updatedAt: now,
    })
    .where(eq(post.id, postId));
}

export async function listCalendarPosts(
  organizationId: string,
  rangeStart: Date,
  rangeEnd: Date,
) {
  const rows = await db
    .select({
      id: post.id,
      body: post.body,
      hasMedia: sql<boolean>`(${post.mediaPath} IS NOT NULL)`,
      status: post.status,
      scheduledAt: post.scheduledAt,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      channelName: connectedAccount.displayName,
      platform: connectedAccount.platform,
    })
    .from(post)
    .innerJoin(connectedAccount, eq(post.connectedAccountId, connectedAccount.id))
    .where(
      and(
        eq(post.organizationId, organizationId),
        or(
          and(
            eq(post.status, "scheduled"),
            gte(post.scheduledAt, rangeStart),
            lte(post.scheduledAt, rangeEnd),
          ),
          and(
            eq(post.status, "published"),
            gte(post.publishedAt, rangeStart),
            lte(post.publishedAt, rangeEnd),
          ),
          and(
            eq(post.status, "failed"),
            gte(post.scheduledAt, rangeStart),
            lte(post.scheduledAt, rangeEnd),
          ),
          and(
            eq(post.status, "pending_approval"),
            or(
              and(
                isNotNull(post.scheduledAt),
                gte(post.scheduledAt, rangeStart),
                lte(post.scheduledAt, rangeEnd),
              ),
              and(
                gte(post.createdAt, rangeStart),
                lte(post.createdAt, rangeEnd),
              ),
            ),
          ),
        ),
      ),
    );

  const calendarPosts = rows
    .map((row) => {
      const displayAt =
        row.status === "published"
          ? row.publishedAt
          : row.status === "pending_approval"
            ? (row.scheduledAt ?? row.createdAt)
            : (row.scheduledAt ?? row.createdAt);
      if (!displayAt) return null;
      return { ...row, status: row.status as PostStatus, displayAt };
    })
    .filter((row): row is CalendarPost => row !== null);

  calendarPosts.sort((a, b) => a.displayAt.getTime() - b.displayAt.getTime());
  return calendarPosts;
}

export async function reschedulePost(input: {
  postId: string;
  organizationId: string;
  scheduledAt: Date;
}) {
  if (input.scheduledAt.getTime() <= Date.now()) {
    throw new Error("Schedule time must be in the future.");
  }

  const [updated] = await db
    .update(post)
    .set({
      status: "scheduled",
      scheduledAt: input.scheduledAt,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(post.id, input.postId),
        eq(post.organizationId, input.organizationId),
        inArray(post.status, ["scheduled", "failed"]),
      ),
    )
    .returning();

  if (!updated) {
    throw new Error("Post not found or cannot be rescheduled.");
  }

  return updated;
}

export async function listDueScheduledPostIds(limit = 50) {
  const now = new Date();
  const rows = await db
    .select({ id: post.id })
    .from(post)
    .where(and(eq(post.status, "scheduled"), lte(post.scheduledAt, now)))
    .limit(limit);

  return rows.map((row) => row.id);
}

export async function countPendingApprovalPosts(organizationId: string) {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(post)
    .where(
      and(eq(post.organizationId, organizationId), eq(post.status, "pending_approval")),
    );

  return result?.count ?? 0;
}

export async function listPendingApprovalPosts(organizationId: string, limit = 30) {
  const rows = await db
    .select({
      id: post.id,
      body: post.body,
      hasMedia: sql<boolean>`(${post.mediaPath} IS NOT NULL)`,
      status: post.status,
      scheduledAt: post.scheduledAt,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      channelName: connectedAccount.displayName,
      platform: connectedAccount.platform,
    })
    .from(post)
    .innerJoin(connectedAccount, eq(post.connectedAccountId, connectedAccount.id))
    .where(
      and(eq(post.organizationId, organizationId), eq(post.status, "pending_approval")),
    )
    .orderBy(desc(post.createdAt))
    .limit(limit);

  return rows as PostWithChannel[];
}

export async function approvePost(postId: string, organizationId: string) {
  const [row] = await db
    .select({
      id: post.id,
      status: post.status,
      scheduledAt: post.scheduledAt,
    })
    .from(post)
    .where(and(eq(post.id, postId), eq(post.organizationId, organizationId)))
    .limit(1);

  if (!row || row.status !== "pending_approval") {
    throw new Error("Post not found or not awaiting approval.");
  }

  const now = new Date();
  const scheduledAt = row.scheduledAt;
  const hasFutureSchedule = Boolean(scheduledAt && scheduledAt.getTime() > now.getTime());

  const [updated] = await db
    .update(post)
    .set({
      status: hasFutureSchedule ? "scheduled" : "draft",
      scheduledAt: hasFutureSchedule ? scheduledAt : null,
      updatedAt: now,
    })
    .where(eq(post.id, postId))
    .returning();

  return {
    post: updated,
    publishNow: !hasFutureSchedule,
    scheduledAt: hasFutureSchedule ? scheduledAt : null,
  };
}

export async function rejectPost(postId: string, organizationId: string) {
  const now = new Date();
  const [updated] = await db
    .update(post)
    .set({
      status: "rejected",
      updatedAt: now,
    })
    .where(
      and(
        eq(post.id, postId),
        eq(post.organizationId, organizationId),
        eq(post.status, "pending_approval"),
      ),
    )
    .returning();

  if (!updated) {
    throw new Error("Post not found or not awaiting approval.");
  }

  return updated;
}
