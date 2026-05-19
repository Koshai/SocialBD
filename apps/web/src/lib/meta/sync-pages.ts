import { getMetaScopeString } from "./scopes";
import { exchangeForLongLivedToken, fetchFacebookPages } from "./client";
import { upsertFacebookPageAccount } from "@socialbd/db";

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
  const scopes = getMetaScopeString();

  for (const page of pages) {
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
