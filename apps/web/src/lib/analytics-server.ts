import {
  countPublishedPosts,
  fetchPageSummary,
  fetchPostEngagement,
  listConnectedAccountsWithTokens,
  listPublishedPostsForAnalytics,
} from "@socialbd/db";

import type { AnalyticsSnapshot, ChannelAnalytics, PostAnalytics } from "./analytics-types";

export type { AnalyticsSnapshot, ChannelAnalytics, PostAnalytics };

export async function buildAnalyticsSnapshot(organizationId: string): Promise<AnalyticsSnapshot> {
  const warnings: string[] = [];
  const [accounts, publishedPosts, publishedCount] = await Promise.all([
    listConnectedAccountsWithTokens(organizationId),
    listPublishedPostsForAnalytics(organizationId),
    countPublishedPosts(organizationId),
  ]);

  const facebookPages = accounts.filter((account) => account.platform === "facebook_page");

  if (facebookPages.length === 0) {
    warnings.push("Connect a Facebook Page from Accounts to see analytics.");
  }

  const channels: ChannelAnalytics[] = [];

  for (const account of facebookPages) {
    try {
      const summary = await fetchPageSummary(account.providerAccountId, account.accessToken);
      const pagePostCount = publishedPosts.filter(
        (post) => post.pageId === account.providerAccountId,
      ).length;

      channels.push({
        id: account.id,
        displayName: summary.name || account.displayName,
        platform: account.platform,
        followers: summary.followers,
        publishedPosts: pagePostCount,
      });
    } catch (error) {
      channels.push({
        id: account.id,
        displayName: account.displayName,
        platform: account.platform,
        followers: null,
        publishedPosts: 0,
        error: error instanceof Error ? error.message : "Could not load page stats.",
      });
    }
  }

  const posts: PostAnalytics[] = [];

  for (const row of publishedPosts) {
    if (row.platform !== "facebook_page") continue;

    try {
      const metrics = await fetchPostEngagement(row.externalPostId, row.pageAccessToken);
      const engagement = metrics.reactions + metrics.comments + metrics.shares;

      posts.push({
        id: row.id,
        body: row.body,
        publishedAt: row.publishedAt.toISOString(),
        channelName: row.channelName,
        platform: row.platform,
        reactions: metrics.reactions,
        comments: metrics.comments,
        shares: metrics.shares,
        impressions: metrics.impressions,
        engagement,
      });
    } catch (error) {
      posts.push({
        id: row.id,
        body: row.body,
        publishedAt: row.publishedAt.toISOString(),
        channelName: row.channelName,
        platform: row.platform,
        reactions: 0,
        comments: 0,
        shares: 0,
        impressions: null,
        engagement: 0,
        error: error instanceof Error ? error.message : "Could not load post metrics.",
      });
    }
  }

  if (posts.some((item) => item.impressions === null && !item.error)) {
    warnings.push(
      "Impressions need pages_read_engagement or read_insights on your Meta app. Reactions, comments, and shares still load when permitted.",
    );
  }

  if (posts.some((item) => item.error)) {
    warnings.push("Some posts could not be loaded from Meta. Tokens may have expired — reconnect the Page.");
  }

  const totals = posts.reduce(
    (acc, item) => {
      acc.reactions += item.reactions;
      acc.comments += item.comments;
      acc.shares += item.shares;
      acc.engagement += item.engagement;
      if (item.impressions != null) {
        acc.impressions = (acc.impressions ?? 0) + item.impressions;
      }
      return acc;
    },
    {
      publishedPosts: publishedCount,
      reactions: 0,
      comments: 0,
      shares: 0,
      impressions: posts.some((p) => p.impressions != null) ? 0 : null,
      engagement: 0,
    },
  );

  return { channels, posts, totals, warnings };
}
