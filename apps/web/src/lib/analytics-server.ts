import {
  MetaApiError,
  countPublishedPosts,
  debugTokenScopes,
  fetchPageSummary,
  fetchPostEngagement,
  listConnectedAccountsWithTokens,
  listPublishedPostsForAnalytics,
  tokenHasScope,
  userMessageForMetaError,
} from "@socialbd/db";

import type { AnalyticsSnapshot, ChannelAnalytics, PostAnalytics } from "./analytics-types";

export type { AnalyticsSnapshot, ChannelAnalytics, PostAnalytics };

const ANALYTICS_SCOPE = "pages_read_engagement";

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

  let pagesMissingScope = 0;
  for (const account of facebookPages) {
    let hasScope = tokenHasScope(account.scopes, ANALYTICS_SCOPE);
    try {
      const granted = await debugTokenScopes(account.accessToken);
      hasScope = granted.includes(ANALYTICS_SCOPE);
    } catch {
      // Fall back to stored scope list from last connect.
    }
    if (!hasScope) pagesMissingScope += 1;
  }

  if (pagesMissingScope > 0) {
    warnings.push(
      "Analytics needs the pages_read_engagement permission on your Page token. Add it to your Meta Login configuration (or enable META_OAUTH_EXTENDED_SCOPES), then disconnect and reconnect each Page under Accounts — saving it in the app dashboard alone is not enough.",
    );
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
        error: userMessageForMetaError(error),
      });
    }
  }

  const posts: PostAnalytics[] = [];
  let permissionFailures = 0;
  let expiredFailures = 0;

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
      if (error instanceof MetaApiError) {
        if (error.kind === "permission") permissionFailures += 1;
        if (error.kind === "expired") expiredFailures += 1;
      }

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
        error: userMessageForMetaError(error),
      });
    }
  }

  if (posts.some((item) => item.impressions === null && !item.error)) {
    warnings.push(
      "Impressions may be unavailable without pages_read_engagement. Reactions, comments, and shares can still load when permitted.",
    );
  }

  if (permissionFailures > 0 && !warnings.some((w) => w.includes("pages_read_engagement"))) {
    warnings.push(
      `${permissionFailures} post(s) failed: Page token is missing pages_read_engagement. Reconnect the Page under Accounts after updating your Meta Login configuration.`,
    );
  }

  if (expiredFailures > 0) {
    warnings.push(
      `${expiredFailures} post(s) failed: access token expired. Disconnect and reconnect the Page under Accounts.`,
    );
  }

  const otherFailures = posts.filter((item) => item.error).length - permissionFailures - expiredFailures;
  if (otherFailures > 0) {
    warnings.push(`${otherFailures} post(s) could not be loaded from Meta. See the error on each post.`);
  }

  const totals = posts.reduce(
    (acc, item) => {
      if (item.error) return acc;
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
      impressions: posts.some((p) => !p.error && p.impressions != null) ? 0 : null,
      engagement: 0,
    },
  );

  return { channels, posts, totals, warnings };
}
