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

export function buildFacebookBoostHandoffUrl(
  externalPostId: string,
  pageId: string,
): string | null {
  return buildFacebookPostPermalink(externalPostId, pageId);
}
