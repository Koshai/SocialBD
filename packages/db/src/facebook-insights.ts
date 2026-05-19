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

export type PostEngagementMetrics = {
  reactions: number;
  comments: number;
  shares: number;
  impressions: number | null;
};

export async function fetchPostEngagement(
  externalPostId: string,
  pageAccessToken: string,
): Promise<PostEngagementMetrics> {
  const baseFields = "comments.summary(true),reactions.summary(true),shares";

  let data: PostEngagementResponse;

  try {
    data = await graphGet<PostEngagementResponse>(`/${externalPostId}`, {
      access_token: pageAccessToken,
      fields: baseFields,
    });
  } catch (error) {
    if (error instanceof MetaApiError) {
      throw error;
    }
    throw error;
  }

  let impressions: number | null = null;

  try {
    const insights = await graphGet<PostEngagementResponse>(`/${externalPostId}`, {
      access_token: pageAccessToken,
      fields: "insights.metric(post_impressions).period(lifetime)",
    });
    const metric = insights.insights?.data?.find((item) => item.name === "post_impressions");
    impressions = metric?.values?.[0]?.value ?? null;
  } catch (error) {
    if (error instanceof MetaApiError && error.kind === "permission") {
      impressions = null;
    } else {
      throw error;
    }
  }

  return {
    reactions: data.reactions?.summary?.total_count ?? 0,
    comments: data.comments?.summary?.total_count ?? 0,
    shares: data.shares?.count ?? 0,
    impressions,
  };
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
