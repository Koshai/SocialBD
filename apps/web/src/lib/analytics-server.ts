import {
  countPublishedPosts,
  fetchPageSummary,
  listConnectedAccountsWithTokens,
  listPublishedPostsForAnalytics,
} from "@socialbd/db";

import type { AnalyticsSnapshot, ChannelAnalytics, PostAnalytics } from "./analytics-types";

export type { AnalyticsSnapshot, ChannelAnalytics, PostAnalytics };

/**
 * Channel-first analytics: published counts from DB + soft follower fetch per channel.
 * No per-post Graph metrics (those caused permission noise). Insights open on the platform.
 */
export async function buildAnalyticsSnapshot(organizationId: string): Promise<AnalyticsSnapshot> {
  const [accounts, publishedPosts, publishedCount] = await Promise.all([
    listConnectedAccountsWithTokens(organizationId),
    listPublishedPostsForAnalytics(organizationId, 80),
    countPublishedPosts(organizationId),
  ]);

  const socialAccounts = accounts.filter(
    (account) => account.platform === "facebook_page" || account.platform === "instagram",
  );

  const warnings: string[] = [
    "Select a channel to browse its published posts. Open a post to view Insights on Facebook or Instagram.",
  ];

  if (socialAccounts.length === 0) {
    warnings.push("Connect a Facebook Page or Instagram account under Accounts to see channels here.");
  }

  const channels: ChannelAnalytics[] = [];

  for (const account of socialAccounts) {
    const publishedOnChannel = publishedPosts.filter(
      (post) => post.pageId === account.providerAccountId,
    ).length;

    let followers: number | null = null;
    let displayName = account.displayName;

    try {
      const summary = await fetchPageSummary(account.providerAccountId, account.accessToken);
      followers = summary.followers;
      if (summary.name?.trim()) displayName = summary.name;
    } catch {
      // Soft-fail: keep local name and unknown followers (no per-post Graph spam).
    }

    channels.push({
      id: account.id,
      displayName,
      platform: account.platform,
      pageId: account.providerAccountId,
      followers,
      publishedPosts: publishedOnChannel,
    });
  }

  const posts: PostAnalytics[] = publishedPosts.map((row) => ({
    id: row.id,
    body: row.body,
    publishedAt: row.publishedAt.toISOString(),
    channelName: row.channelName,
    platform: row.platform,
    externalPostId: row.externalPostId,
    pageId: row.pageId,
    reactions: 0,
    comments: 0,
    shares: 0,
    impressions: null,
    engagement: 0,
  }));

  return {
    channels,
    posts,
    totals: {
      publishedPosts: publishedCount,
      reactions: 0,
      comments: 0,
      shares: 0,
      impressions: null,
      engagement: 0,
    },
    warnings,
  };
}
