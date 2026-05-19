import { and, desc, eq, gte, inArray, lte, or, sql } from "drizzle-orm";

import { db } from "./db";
import { connectedAccount } from "./schema/connected-account";
import { post } from "./schema/post";

export type PostStatus = "draft" | "scheduled" | "published" | "failed";

export type PostWithChannel = {
  id: string;
  body: string;
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
  scheduledAt?: Date | null;
}) {
  const now = new Date();
  const trimmedBody = input.body.trim();
  if (!trimmedBody) {
    throw new Error("Post body is required.");
  }

  const scheduledAt = input.scheduledAt ?? null;
  const status: PostStatus =
    scheduledAt && scheduledAt.getTime() > now.getTime() ? "scheduled" : "draft";

  const [row] = await db
    .insert(post)
    .values({
      id: crypto.randomUUID(),
      organizationId: input.organizationId,
      connectedAccountId: input.connectedAccountId,
      createdByUserId: input.createdByUserId,
      body: trimmedBody,
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

export async function listPostsForOrganization(organizationId: string, limit = 20) {
  const rows = await db
    .select({
      id: post.id,
      body: post.body,
      status: post.status,
      scheduledAt: post.scheduledAt,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      channelName: connectedAccount.displayName,
      platform: connectedAccount.platform,
    })
    .from(post)
    .innerJoin(connectedAccount, eq(post.connectedAccountId, connectedAccount.id))
    .where(eq(post.organizationId, organizationId))
    .orderBy(desc(post.createdAt))
    .limit(limit);

  return rows as PostWithChannel[];
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
    .select({ id: connectedAccount.id })
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
        ),
      ),
    );

  const calendarPosts = rows
    .map((row) => {
      const displayAt =
        row.status === "published" ? row.publishedAt : (row.scheduledAt ?? row.createdAt);
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
