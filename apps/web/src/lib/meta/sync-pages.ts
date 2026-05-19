import { debugTokenScopes, upsertFacebookPageAccount } from "@socialbd/db";

import { exchangeForLongLivedToken, fetchFacebookPages } from "./client";
import { getMetaScopeString } from "./scopes";

export async function syncFacebookPagesForOrganization(input: {
  organizationId: string;
  userAccessToken: string;
  tokenExpiresInSeconds?: number;
}) {
  const longLived = await exchangeForLongLivedToken(input.userAccessToken);
  const tokenExpiresAt =
    longLived.expires_in != null
      ? new Date(Date.now() + longLived.expires_in * 1000)
      : null;

  const pages = await fetchFacebookPages(longLived.access_token);
  const requestedScopes = getMetaScopeString();

  for (const page of pages) {
    let scopes = requestedScopes;
    try {
      const granted = await debugTokenScopes(page.access_token);
      scopes = granted.join(",");
    } catch {
      // Keep requested scope list if debug_token is unavailable.
    }

    await upsertFacebookPageAccount({
      organizationId: input.organizationId,
      pageId: page.id,
      displayName: page.name,
      username: page.username ?? null,
      pictureUrl: page.picture?.data?.url ?? null,
      accessToken: page.access_token,
      tokenExpiresAt,
      scopes,
    });
  }

  return pages.length;
}
