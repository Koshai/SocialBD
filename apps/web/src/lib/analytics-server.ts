import {
  MetaApiError,
  countPublishedPosts,
  fetchInstagramSummary,
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

async function mapPool<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>) {
  if (items.length === 0) return [] as R[];
  const results = new Array<R>(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await fn(items[index]!);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

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

  // Use stored token scopes only (no debug_token round-trips per page).
  const pageScopeById = new Map<string, boolean>();
  let pagesMissingScope = 0;
  for (const account of facebookPages) {
    const hasScope = tokenHasScope(account.scopes, ANALYTICS_SCOPE);
    pageScopeById.set(account.providerAccountId, hasScope);
    if (!hasScope) pagesMissingScope += 1;
  }

  if (pagesMissingScope > 0) {
    warnings.push(
      "Some Pages are missing pages_read_engagement. Reconnect Facebook under Accounts if metrics look incomplete.",
    );
  }

  const channels: ChannelAnalytics[] = await mapPool(socialAccounts, 5, async (account) => {
    const publishedOnChannel = publishedPosts.filter(
      (post) => post.pageId === account.providerAccountId,
    ).length;

    try {
      const summary =
        account.platform === "instagram"
          ? await fetchInstagramSummary(account.providerAccountId, account.accessToken)
          : await fetchPageSummary(account.providerAccountId, account.accessToken);
      return {
        id: account.id,
        displayName: summary.name?.trim() || account.displayName,
        platform: account.platform,
        pageId: account.providerAccountId,
        followers: summary.followers,
        publishedPosts: publishedOnChannel,
      };
    } catch (error) {
      return {
        id: account.id,
        displayName: account.displayName,
        platform: account.platform,
        pageId: account.providerAccountId,
        followers: null,
        publishedPosts: publishedOnChannel,
        error: userMessageForMetaError(error),
      };
    }
  });

  let permissionFailures = 0;
  let expiredFailures = 0;
  const permissionFailurePages = new Set<string>();

  const posts: PostAnalytics[] = await mapPool(publishedPosts, 6, async (row) => {
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
      return {
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
      };
    }

    const hasEngagementScope = pageScopeById.get(row.pageId) ?? false;

    try {
      const metrics = await fetchPostEngagement(
        row.externalPostId,
        row.pageAccessToken,
        row.pageId,
      );
      const engagement = metrics.reactions + metrics.comments + metrics.shares;

      return {
        ...base,
        reactions: metrics.reactions,
        comments: metrics.comments,
        shares: metrics.shares,
        impressions: metrics.impressions,
        engagement,
      };
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

      return {
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
      };
    }
  });

  if (posts.some((item) => item.platform === "facebook_page" && item.impressions === null && !item.error)) {
    warnings.push(
      "Impressions may be unavailable without pages_read_engagement. Reactions, comments, and shares can still load when permitted.",
    );
  }

  if (permissionFailures > 0) {
    const pageList = [...permissionFailurePages].join(", ");
    warnings.push(
      `${permissionFailures} post(s) on ${pageList}: missing engagement permission. Reconnect Facebook under Accounts if needed.`,
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
