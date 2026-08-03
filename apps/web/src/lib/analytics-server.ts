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

/**
 * Channel list + per-post Graph metrics for Facebook Pages (when tokens allow).
 * Instagram posts stay list-only; open platform Insights for IG metrics.
 */
export async function buildAnalyticsSnapshot(organizationId: string): Promise<AnalyticsSnapshot> {
  const warnings: string[] = [];
  const [accounts, publishedPosts, publishedCount] = await Promise.all([
    listConnectedAccountsWithTokens(organizationId),
    listPublishedPostsForAnalytics(organizationId, 25),
    countPublishedPosts(organizationId),
  ]);

  const socialAccounts = accounts.filter(
    (account) => account.platform === "facebook_page" || account.platform === "instagram",
  );
  const facebookPages = socialAccounts.filter((account) => account.platform === "facebook_page");

  if (socialAccounts.length === 0) {
    warnings.push("Connect a Facebook Page or Instagram account under Accounts to see analytics.");
  }

  const pageScopeById = new Map<string, boolean>();
  let pagesMissingScope = 0;
  for (const account of facebookPages) {
    let hasScope = tokenHasScope(account.scopes, ANALYTICS_SCOPE);
    try {
      const granted = await debugTokenScopes(account.accessToken);
      hasScope = granted.includes(ANALYTICS_SCOPE);
    } catch {
      // Fall back to stored scope list from last connect.
    }
    pageScopeById.set(account.providerAccountId, hasScope);
    if (!hasScope) pagesMissingScope += 1;
  }

  if (pagesMissingScope > 0) {
    warnings.push(
      "Analytics needs the pages_read_engagement permission on your Page token. Add it to your Meta Login configuration (or enable META_OAUTH_EXTENDED_SCOPES), then disconnect and reconnect each Page under Accounts — saving it in the app dashboard alone is not enough.",
    );
  }

  const channels: ChannelAnalytics[] = [];

  for (const account of socialAccounts) {
    const publishedOnChannel = publishedPosts.filter(
      (post) => post.pageId === account.providerAccountId,
    ).length;

    try {
      const summary = await fetchPageSummary(account.providerAccountId, account.accessToken);
      channels.push({
        id: account.id,
        displayName: summary.name?.trim() || account.displayName,
        platform: account.platform,
        pageId: account.providerAccountId,
        followers: summary.followers,
        publishedPosts: publishedOnChannel,
      });
    } catch (error) {
      channels.push({
        id: account.id,
        displayName: account.displayName,
        platform: account.platform,
        pageId: account.providerAccountId,
        followers: null,
        publishedPosts: publishedOnChannel,
        error: userMessageForMetaError(error),
      });
    }
  }

  const posts: PostAnalytics[] = [];
  let permissionFailures = 0;
  let expiredFailures = 0;
  const permissionFailurePages = new Set<string>();

  for (const row of publishedPosts) {
    const base = {
      id: row.id,
      body: row.body,
      publishedAt: row.publishedAt.toISOString(),
      channelName: row.channelName,
      platform: row.platform,
      externalPostId: row.externalPostId,
      pageId: row.pageId,
    };

    if (row.platform !== "facebook_page") {
      posts.push({
        ...base,
        reactions: 0,
        comments: 0,
        shares: 0,
        impressions: null,
        engagement: 0,
        error:
          row.platform === "instagram"
            ? "In-app engagement is available for Facebook Page posts. Open Instagram Insights on the platform."
            : undefined,
      });
      continue;
    }

    const hasEngagementScope = pageScopeById.get(row.pageId) ?? false;

    try {
      const metrics = await fetchPostEngagement(
        row.externalPostId,
        row.pageAccessToken,
        row.pageId,
      );
      const engagement = metrics.reactions + metrics.comments + metrics.shares;

      posts.push({
        ...base,
        reactions: metrics.reactions,
        comments: metrics.comments,
        shares: metrics.shares,
        impressions: metrics.impressions,
        engagement,
      });
    } catch (error) {
      if (error instanceof MetaApiError) {
        if (error.kind === "permission") {
          if (!hasEngagementScope) {
            permissionFailures += 1;
            permissionFailurePages.add(row.channelName);
          }
        }
        if (error.kind === "expired") expiredFailures += 1;
      }

      posts.push({
        ...base,
        reactions: 0,
        comments: 0,
        shares: 0,
        impressions: null,
        engagement: 0,
        error: userMessageForMetaError(error, {
          hasEngagementScope,
          channelName: row.channelName,
        }),
      });
    }
  }

  if (posts.some((item) => item.platform === "facebook_page" && item.impressions === null && !item.error)) {
    warnings.push(
      "Impressions may be unavailable without pages_read_engagement. Reactions, comments, and shares can still load when permitted.",
    );
  }

  if (permissionFailures > 0 && !warnings.some((w) => w.includes("pages_read_engagement"))) {
    const pageList = [...permissionFailurePages].join(", ");
    warnings.push(
      `${permissionFailures} post(s) on ${pageList}: Page token is missing pages_read_engagement. Reconnect that Page under Accounts after updating your Meta Login configuration.`,
    );
  }

  if (expiredFailures > 0) {
    warnings.push(
      `${expiredFailures} post(s) failed: access token expired. Disconnect and reconnect the Page under Accounts.`,
    );
  }

  const otherFailures =
    posts.filter((item) => item.error && item.platform === "facebook_page").length -
    permissionFailures -
    expiredFailures;
  if (otherFailures > 0) {
    warnings.push(`${otherFailures} post(s) could not be loaded from Meta. See the error on each post.`);
  }

  const totals = posts.reduce(
    (acc, item) => {
      if (item.error || item.platform !== "facebook_page") return acc;
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
      impressions: posts.some((p) => p.platform === "facebook_page" && !p.error && p.impressions != null)
        ? 0
        : null,
      engagement: 0,
    },
  );

  return { channels, posts, totals, warnings };
}
