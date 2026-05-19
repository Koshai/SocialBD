const GRAPH_VERSION = "v21.0";

type FeedResponse = {
  id?: string;
  error?: { message: string; code?: number };
};

export async function publishFacebookPagePost(input: {
  pageId: string;
  pageAccessToken: string;
  message: string;
}) {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${input.pageId}/feed`);
  url.searchParams.set("access_token", input.pageAccessToken);
  url.searchParams.set("message", input.message);

  const response = await fetch(url, { method: "POST" });
  const json = (await response.json()) as FeedResponse;

  if (!response.ok || json.error || !json.id) {
    throw new Error(json.error?.message ?? `Facebook publish failed (${response.status}).`);
  }

  return { externalPostId: json.id };
}
