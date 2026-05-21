import { MetaApiError, classifyMetaErrorMessage } from "./meta-errors";

const GRAPH_VERSION = "v21.0";

type GraphError = { message: string; code?: number; error_subcode?: number };

function getAppAccessToken() {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error("Meta app credentials are not configured.");
  }
  return `${appId}|${appSecret}`;
}

async function graphGet<T>(path: string, params: Record<string, string>) {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url);
  const json = (await response.json()) as T & { error?: GraphError };

  if (!response.ok || json.error) {
    const message = json.error?.message ?? `Meta API failed (${response.status}).`;
    const kind = classifyMetaErrorMessage(message, json.error?.code, json.error?.error_subcode);
    throw new MetaApiError(message, kind, json.error?.code, json.error?.error_subcode);
  }

  return json;
}

type DebugTokenResponse = {
  data?: {
    is_valid?: boolean;
    scopes?: string[];
  };
};

export async function debugTokenScopes(accessToken: string) {
  const json = await graphGet<DebugTokenResponse>("/debug_token", {
    input_token: accessToken,
    access_token: getAppAccessToken(),
  });

  if (!json.data?.is_valid) {
    throw new MetaApiError(
      "Access token is invalid or expired. Reconnect the Page under Accounts.",
      "expired",
    );
  }

  return json.data.scopes ?? [];
}

export function tokenHasScope(scopes: string[] | string | null | undefined, scope: string) {
  if (!scopes) return false;
  if (Array.isArray(scopes)) {
    return scopes.includes(scope);
  }
  return scopes
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .includes(scope);
}

type SummaryNode = {
  summary?: { total_count?: number };
};

type PostEngagementResponse = {
  id?: string;
  comments?: SummaryNode;
  reactions?: SummaryNode;
  shares?: { count?: number };
  insights?: {
    data?: Array<{
      name?: string;
      values?: Array<{ value?: number }>;
    }>;
  };
};

type PagedListResponse = {
  data?: Array<{ id?: string }>;
  paging?: { cursors?: { after?: string } };
};

export type PostEngagementMetrics = {
  reactions: number;
  comments: number;
  shares: number;
  impressions: number | null;
};

/** Graph post ids are usually `{pageId}_{postId}`; normalize when only the story id was stored. */
export function normalizeFacebookPostId(externalPostId: string, pageId: string) {
  if (externalPostId.includes("_")) return externalPostId;
  return `${pageId}_${externalPostId}`;
}

function postIdSuffix(id: string) {
  const idx = id.indexOf("_");
  return idx === -1 ? id : id.slice(idx + 1);
}

function matchesTargetPost(candidateId: string | undefined, targetId: string, rawId: string) {
  if (!candidateId) return false;
  if (candidateId === targetId || candidateId === rawId) return true;
  return postIdSuffix(candidateId) === postIdSuffix(targetId);
}

function metricsFromRow(row: PostEngagementResponse): PostEngagementMetrics {
  return {
    reactions: row.reactions?.summary?.total_count ?? 0,
    comments: row.comments?.summary?.total_count ?? 0,
    shares: row.shares?.count ?? 0,
    impressions: null,
  };
}

async function tryFetchImpressions(postId: string, pageAccessToken: string) {
  try {
    const insights = await graphGet<PostEngagementResponse>(`/${postId}`, {
      access_token: pageAccessToken,
      fields: "insights.metric(post_impressions).period(lifetime)",
    });
    const metric = insights.insights?.data?.find((item) => item.name === "post_impressions");
    return metric?.values?.[0]?.value ?? null;
  } catch (error) {
    if (error instanceof MetaApiError && error.kind === "permission") {
      return null;
    }
    return null;
  }
}

/** Meta often rejects engagement fields on a bare post id; listing via the Page works. */
async function findPostIdOnPage(
  pageId: string,
  targetId: string,
  rawId: string,
  pageAccessToken: string,
): Promise<string | null> {
  const listPaths = [`/${pageId}/published_posts`, `/${pageId}/posts`, `/${pageId}/feed`] as const;

  for (const listPath of listPaths) {
    let after: string | undefined;

    for (let page = 0; page < 10; page++) {
      const params: Record<string, string> = {
        access_token: pageAccessToken,
        fields: "id",
        limit: "50",
      };
      if (after) params.after = after;

      const response = await graphGet<PagedListResponse>(listPath, params);

      for (const row of response.data ?? []) {
        if (matchesTargetPost(row.id, targetId, rawId) && row.id) {
          return row.id;
        }
      }

      after = response.paging?.cursors?.after;
      if (!after) break;
    }
  }

  return null;
}

async function fetchEngagementFieldsOnPost(postId: string, pageAccessToken: string) {
  const fields = "comments.limit(0).summary(true),reactions.limit(0).summary(true),shares";
  const data = await graphGet<PostEngagementResponse>(`/${postId}`, {
    access_token: pageAccessToken,
    fields,
  });
  return metricsFromRow(data);
}

async function fetchEngagementViaPostEdges(postId: string, pageAccessToken: string) {
  const reactions = await graphGet<SummaryNode>(`/${postId}/reactions`, {
    access_token: pageAccessToken,
    summary: "true",
    limit: "0",
  });

  const comments = await graphGet<SummaryNode>(`/${postId}/comments`, {
    access_token: pageAccessToken,
    summary: "true",
    limit: "0",
  });

  const sharesNode = await graphGet<PostEngagementResponse>(`/${postId}`, {
    access_token: pageAccessToken,
    fields: "shares",
  });

  return {
    reactions: reactions.summary?.total_count ?? 0,
    comments: comments.summary?.total_count ?? 0,
    shares: sharesNode.shares?.count ?? 0,
    impressions: null,
  } satisfies PostEngagementMetrics;
}

async function fetchEngagementFromPageListWithFields(
  listPath: string,
  targetId: string,
  rawId: string,
  pageAccessToken: string,
) {
  const fields = `id,comments.limit(0).summary(true),reactions.limit(0).summary(true),shares`;
  let after: string | undefined;

  for (let page = 0; page < 10; page++) {
    const params: Record<string, string> = {
      access_token: pageAccessToken,
      fields,
      limit: "50",
    };
    if (after) params.after = after;

    const response = await graphGet<{ data?: PostEngagementResponse[]; paging?: PagedListResponse["paging"] }>(
      listPath,
      params,
    );

    for (const row of response.data ?? []) {
      if (matchesTargetPost(row.id, targetId, rawId)) {
        return metricsFromRow(row);
      }
    }

    after = response.paging?.cursors?.after;
    if (!after) break;
  }

  return null;
}

export async function fetchPostEngagement(
  externalPostId: string,
  pageAccessToken: string,
  pageId?: string,
): Promise<PostEngagementMetrics> {
  const rawId = externalPostId;
  const postId = pageId ? normalizeFacebookPostId(externalPostId, pageId) : externalPostId;
  const pageIdFromPost = postId.includes("_") ? postId.split("_")[0]! : undefined;
  const effectivePageId = pageIdFromPost ?? pageId;

  let lastError: unknown;

  if (effectivePageId) {
    for (const listPath of [
      `/${effectivePageId}/published_posts`,
      `/${effectivePageId}/posts`,
      `/${effectivePageId}/feed`,
    ] as const) {
      try {
        const fromList = await fetchEngagementFromPageListWithFields(
          listPath,
          postId,
          rawId,
          pageAccessToken,
        );
        if (fromList) {
          const impressions = await tryFetchImpressions(postId, pageAccessToken);
          return { ...fromList, impressions };
        }
      } catch (error) {
        lastError = error;
      }
    }

    try {
      const resolvedId =
        (await findPostIdOnPage(effectivePageId, postId, rawId, pageAccessToken)) ?? postId;

      for (const attemptId of [resolvedId, postId, rawId]) {
        if (!attemptId) continue;
        try {
          const metrics = await fetchEngagementFieldsOnPost(attemptId, pageAccessToken);
          const impressions = await tryFetchImpressions(attemptId, pageAccessToken);
          return { ...metrics, impressions };
        } catch (error) {
          lastError = error;
          if (error instanceof MetaApiError && error.kind === "permission") {
            try {
              const viaEdges = await fetchEngagementViaPostEdges(attemptId, pageAccessToken);
              const impressions = await tryFetchImpressions(attemptId, pageAccessToken);
              return { ...viaEdges, impressions };
            } catch (edgeError) {
              lastError = edgeError;
            }
          }
        }
      }
    } catch (error) {
      lastError = error;
    }
  }

  try {
    const metrics = await fetchEngagementFieldsOnPost(postId, pageAccessToken);
    const impressions = await tryFetchImpressions(postId, pageAccessToken);
    return { ...metrics, impressions };
  } catch (error) {
    lastError = error;
    if (error instanceof MetaApiError && error.kind === "permission") {
      try {
        const viaEdges = await fetchEngagementViaPostEdges(postId, pageAccessToken);
        const impressions = await tryFetchImpressions(postId, pageAccessToken);
        return { ...viaEdges, impressions };
      } catch (edgeError) {
        lastError = edgeError;
      }
    }
  }

  if (lastError instanceof MetaApiError) {
    throw lastError;
  }
  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new MetaApiError(
    "Post was not found on the Page feed. If you published from SocialBD, try refreshing in a minute.",
    "unknown",
  );
}

type PageSummaryResponse = {
  name?: string;
  followers_count?: number;
  fan_count?: number;
};

export type PageSummaryMetrics = {
  name: string;
  followers: number | null;
};

export async function fetchPageSummary(pageId: string, pageAccessToken: string) {
  const data = await graphGet<PageSummaryResponse>(`/${pageId}`, {
    access_token: pageAccessToken,
    fields: "name,followers_count,fan_count",
  });

  const followers = data.followers_count ?? data.fan_count ?? null;

  return {
    name: data.name ?? "Facebook Page",
    followers,
  } satisfies PageSummaryMetrics;
}
