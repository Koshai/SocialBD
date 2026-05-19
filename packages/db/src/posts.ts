import { and, desc, eq, sql } from "drizzle-orm";

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
