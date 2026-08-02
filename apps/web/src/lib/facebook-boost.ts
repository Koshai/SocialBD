/** Graph post ids are usually `{pageId}_{postId}`; keep in sync with packages/db facebook-insights. */
function normalizeFacebookPostId(externalPostId: string, pageId: string) {
  if (externalPostId.includes("_")) return externalPostId;
  return `${pageId}_${externalPostId}`;
}

/** Public permalink for a published Page post (opens on facebook.com). */
export function buildFacebookPostPermalink(externalPostId: string, pageId: string) {
  const fullId = normalizeFacebookPostId(externalPostId.trim(), pageId.trim());
  const underscore = fullId.indexOf("_");
  if (underscore <= 0) return null;

  const fbPageId = fullId.slice(0, underscore);
  const storyFbid = fullId.slice(underscore + 1);
  if (!fbPageId || !storyFbid) return null;

  return `https://www.facebook.com/${encodeURIComponent(fbPageId)}/posts/${encodeURIComponent(storyFbid)}`;
}

/**
 * Open the published Page post itself (reliable per-post link).
 * From the post, Page admins can open Insights in Meta.
 * Prefer this over Business Suite “view” URLs, which often land on the Page home.
 */
export function buildFacebookPostInsightsUrl(externalPostId: string, pageId: string) {
  return buildFacebookPostPermalink(externalPostId, pageId);
}

export function canBoostFacebookPost(input: {
  platform: string;
  status: string;
  externalPostId: string | null | undefined;
  pageId: string | null | undefined;
}) {
  return (
    input.platform === "facebook_page" &&
    input.status === "published" &&
    Boolean(input.externalPostId?.trim() && input.pageId?.trim())
  );
}

export function canOpenPlatformPost(input: {
  platform: string;
  status: string;
  externalPostId: string | null | undefined;
  pageId: string | null | undefined;
}) {
  if (input.status !== "published" || !input.externalPostId?.trim()) return false;
  if (input.platform === "facebook_page") {
    return Boolean(input.pageId?.trim());
  }
  if (input.platform === "instagram") {
    return true;
  }
  return false;
}

export function buildFacebookBoostHandoffUrl(
  externalPostId: string,
  pageId: string,
): string | null {
  return buildFacebookPostPermalink(externalPostId, pageId);
}

const GRAPH_VERSION = "v21.0";

/** Resolve Instagram media permalink via Graph (needs a valid Page token). */
export async function resolveInstagramPermalink(
  mediaId: string,
  accessToken: string,
): Promise<string | null> {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${mediaId}`);
  url.searchParams.set("fields", "permalink");
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url);
  const json = (await response.json()) as { permalink?: string; error?: { message?: string } };
  if (!response.ok || json.error || !json.permalink) {
    return null;
  }
  return json.permalink;
}
