import { and, desc, eq, gte, inArray, isNotNull, lt, lte, or, sql } from "drizzle-orm";

import { db } from "./db";
import { user } from "./schema/auth";
import { connectedAccount } from "./schema/connected-account";
import { organization } from "./schema/organization";
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
  externalPostId: string | null;
  pageId: string;
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
  externalPostId: post.externalPostId,
  pageId: connectedAccount.providerAccountId,
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

export async function getPublishedPostPlatformContext(
  postId: string,
  organizationId: string,
) {
  const [row] = await db
    .select({
      id: post.id,
      status: post.status,
      externalPostId: post.externalPostId,
      platform: connectedAccount.platform,
      pageId: connectedAccount.providerAccountId,
      pageAccessToken: connectedAccount.accessToken,
    })
    .from(post)
    .innerJoin(connectedAccount, eq(post.connectedAccountId, connectedAccount.id))
    .where(and(eq(post.id, postId), eq(post.organizationId, organizationId)))
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
      externalPostId: post.externalPostId,
      pageId: connectedAccount.providerAccountId,
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

export type PostDetail = {
  id: string;
  body: string;
  mediaPath: string | null;
  mediaMimeType: string | null;
  status: PostStatus;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  connectedAccountId: string;
  channelName: string;
  platform: string;
  externalPostId: string | null;
  pageId: string;
  canEdit: boolean;
  canReschedule: boolean;
};

const EDITABLE_STATUSES: PostStatus[] = ["draft", "scheduled"];
const RESCHEDULE_STATUSES: PostStatus[] = ["scheduled", "failed"];

export async function getPostDetail(
  postId: string,
  organizationId: string,
): Promise<PostDetail | null> {
  const [row] = await db
    .select({
      id: post.id,
      body: post.body,
      mediaPath: post.mediaPath,
      mediaMimeType: post.mediaMimeType,
      status: post.status,
      scheduledAt: post.scheduledAt,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      connectedAccountId: post.connectedAccountId,
      channelName: connectedAccount.displayName,
      platform: connectedAccount.platform,
      externalPostId: post.externalPostId,
      pageId: connectedAccount.providerAccountId,
    })
    .from(post)
    .innerJoin(connectedAccount, eq(post.connectedAccountId, connectedAccount.id))
    .where(and(eq(post.id, postId), eq(post.organizationId, organizationId)))
    .limit(1);

  if (!row) return null;

  const status = row.status as PostStatus;
  return {
    ...row,
    status,
    canEdit: EDITABLE_STATUSES.includes(status),
    canReschedule: RESCHEDULE_STATUSES.includes(status),
  };
}

export async function updateEditablePost(input: {
  postId: string;
  organizationId: string;
  connectedAccountId: string;
  body: string;
  mediaPath?: string | null;
  mediaMimeType?: string | null;
  scheduledAt?: Date | null;
}) {
  const trimmedBody = input.body.trim();
  if (!trimmedBody && !input.mediaPath) {
    throw new Error("Add a caption or an image.");
  }

  const now = new Date();
  const scheduledAt = input.scheduledAt ?? null;
  let status: PostStatus = "draft";
  let nextScheduledAt: Date | null = null;

  if (scheduledAt && scheduledAt.getTime() > now.getTime()) {
    status = "scheduled";
    nextScheduledAt = scheduledAt;
  } else if (scheduledAt && scheduledAt.getTime() <= now.getTime()) {
    throw new Error("Schedule time must be in the future.");
  }

  const [updated] = await db
    .update(post)
    .set({
      connectedAccountId: input.connectedAccountId,
      body: trimmedBody,
      mediaPath: input.mediaPath ?? null,
      mediaMimeType: input.mediaMimeType ?? null,
      status,
      scheduledAt: nextScheduledAt,
      updatedAt: now,
    })
    .where(
      and(
        eq(post.id, input.postId),
        eq(post.organizationId, input.organizationId),
        inArray(post.status, EDITABLE_STATUSES),
      ),
    )
    .returning();

  if (!updated) {
    throw new Error("Post not found or cannot be edited.");
  }

  return updated;
}

export async function listPostsByIds(postIds: string[], organizationId: string) {
  if (postIds.length === 0) return [];

  return db
    .select({
      id: post.id,
      body: post.body,
      mediaPath: post.mediaPath,
      mediaMimeType: post.mediaMimeType,
      status: post.status,
      scheduledAt: post.scheduledAt,
      createdAt: post.createdAt,
      connectedAccountId: post.connectedAccountId,
      createdByUserId: post.createdByUserId,
    })
    .from(post)
    .where(and(eq(post.organizationId, organizationId), inArray(post.id, postIds)));
}

export async function duplicatePosts(input: {
  organizationId: string;
  createdByUserId: string;
  sourcePostIds: string[];
  /** Absolute target scheduledAt per source post id (already shifted by caller). */
  scheduledAtByPostId: Record<string, Date>;
}) {
  const sources = await listPostsByIds(input.sourcePostIds, input.organizationId);
  if (sources.length === 0) {
    throw new Error("No posts found to duplicate.");
  }

  const now = new Date();
  const created: Array<{ id: string; status: PostStatus; scheduledAt: Date | null }> = [];

  for (const source of sources) {
    const targetAt = input.scheduledAtByPostId[source.id];
    if (!targetAt || Number.isNaN(targetAt.getTime())) {
      continue;
    }

    let status: PostStatus = "draft";
    let scheduledAt: Date | null = null;
    if (targetAt.getTime() > now.getTime()) {
      status = "scheduled";
      scheduledAt = targetAt;
    }

    const [row] = await db
      .insert(post)
      .values({
        id: crypto.randomUUID(),
        organizationId: input.organizationId,
        connectedAccountId: source.connectedAccountId,
        createdByUserId: input.createdByUserId,
        body: source.body,
        mediaPath: source.mediaPath,
        mediaMimeType: source.mediaMimeType,
        status,
        scheduledAt,
        publishedAt: null,
        externalPostId: null,
        createdAt: now,
        updatedAt: now,
      })
      .returning({
        id: post.id,
        status: post.status,
        scheduledAt: post.scheduledAt,
      });

    if (row) {
      created.push({
        id: row.id,
        status: row.status as PostStatus,
        scheduledAt: row.scheduledAt,
      });
    }
  }

  return created;
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
      externalPostId: post.externalPostId,
      pageId: connectedAccount.providerAccountId,
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

export async function getPostApprovalNotificationContext(postId: string, organizationId: string) {
  const [row] = await db
    .select({
      id: post.id,
      body: post.body,
      hasMedia: sql<boolean>`(${post.mediaPath} IS NOT NULL)`,
      scheduledAt: post.scheduledAt,
      channelName: connectedAccount.displayName,
      platform: connectedAccount.platform,
      creatorUserId: post.createdByUserId,
      creatorEmail: user.email,
      creatorName: user.name,
      organizationName: organization.name,
    })
    .from(post)
    .innerJoin(connectedAccount, eq(post.connectedAccountId, connectedAccount.id))
    .innerJoin(user, eq(post.createdByUserId, user.id))
    .innerJoin(organization, eq(post.organizationId, organization.id))
    .where(and(eq(post.id, postId), eq(post.organizationId, organizationId)))
    .limit(1);

  return row ?? null;
}
