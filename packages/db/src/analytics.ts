import { and, desc, eq, isNotNull, sql } from "drizzle-orm";

import { db } from "./db";
import { connectedAccount } from "./schema/connected-account";
import { post } from "./schema/post";

export type PublishedPostForAnalytics = {
  id: string;
  body: string;
  publishedAt: Date;
  externalPostId: string;
  channelName: string;
  platform: string;
  pageId: string;
  pageAccessToken: string;
};

export async function listPublishedPostsForAnalytics(organizationId: string, limit = 15) {
  const rows = await db
    .select({
      id: post.id,
      body: post.body,
      publishedAt: post.publishedAt,
      externalPostId: post.externalPostId,
      channelName: connectedAccount.displayName,
      platform: connectedAccount.platform,
      pageId: connectedAccount.providerAccountId,
      pageAccessToken: connectedAccount.accessToken,
    })
    .from(post)
    .innerJoin(connectedAccount, eq(post.connectedAccountId, connectedAccount.id))
    .where(
      and(
        eq(post.organizationId, organizationId),
        eq(post.status, "published"),
        isNotNull(post.externalPostId),
        isNotNull(post.publishedAt),
      ),
    )
    .orderBy(desc(post.publishedAt))
    .limit(limit);

  const filtered = rows
    .filter((row): row is PublishedPostForAnalytics => Boolean(row.externalPostId && row.publishedAt))
    .map((row) => ({
      ...row,
      externalPostId: row.externalPostId!,
      publishedAt: row.publishedAt!,
    }));

  const accounts = await listConnectedAccountsWithTokens(organizationId);
  const accountByPageId = new Map(
    accounts
      .filter((account) => account.platform === "facebook_page")
      .map((account) => [account.providerAccountId, account]),
  );

  return filtered.map((row) => {
    const live = accountByPageId.get(row.pageId);
    if (!live) return row;
    return {
      ...row,
      pageAccessToken: live.accessToken,
      channelName: live.displayName,
    };
  });
}

export async function countPublishedPosts(organizationId: string) {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(post)
    .where(and(eq(post.organizationId, organizationId), eq(post.status, "published")));

  return result?.count ?? 0;
}

export type ConnectedAccountWithToken = {
  id: string;
  displayName: string;
  platform: string;
  providerAccountId: string;
  accessToken: string;
  scopes: string | null;
};

export async function listConnectedAccountsWithTokens(organizationId: string) {
  const rows = await db
    .select({
      id: connectedAccount.id,
      displayName: connectedAccount.displayName,
      platform: connectedAccount.platform,
      providerAccountId: connectedAccount.providerAccountId,
      accessToken: connectedAccount.accessToken,
      scopes: connectedAccount.scopes,
    })
    .from(connectedAccount)
    .where(
      and(eq(connectedAccount.organizationId, organizationId), eq(connectedAccount.status, "active")),
    );

  return rows;
}
