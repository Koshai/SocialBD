const GRAPH_VERSION = "v21.0";

type GraphError = { message: string; code?: number };

async function graphGet<T>(path: string, params: Record<string, string>) {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url);
  const json = (await response.json()) as T & { error?: GraphError };

  if (!response.ok || json.error) {
    throw new Error(json.error?.message ?? `Meta API failed (${response.status}).`);
  }

  return json;
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

  try {
    const withInsights = await graphGet<PostEngagementResponse>(`/${externalPostId}`, {
      access_token: pageAccessToken,
      fields: `${baseFields},insights.metric(post_impressions).period(lifetime)`,
    });

    return parsePostEngagement(withInsights, true);
  } catch {
    const basic = await graphGet<PostEngagementResponse>(`/${externalPostId}`, {
      access_token: pageAccessToken,
      fields: baseFields,
    });

    return parsePostEngagement(basic, false);
  }
}

function parsePostEngagement(
  data: PostEngagementResponse,
  hasInsights: boolean,
): PostEngagementMetrics {
  let impressions: number | null = null;

  if (hasInsights) {
    const metric = data.insights?.data?.find((item) => item.name === "post_impressions");
    impressions = metric?.values?.[0]?.value ?? null;
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
