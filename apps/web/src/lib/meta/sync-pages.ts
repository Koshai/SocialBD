<<<<<<< HEAD
import { debugTokenScopes, upsertFacebookPageAccount, upsertInstagramAccount } from "@socialbd/db";

import { exchangeForLongLivedToken, fetchFacebookPages } from "./client";
import { getMetaScopeString } from "./scopes";
=======
import {
  assertChannelCapacity,
  countNewMetaConnections,
  debugTokenScopes,
  upsertFacebookPageAccount,
  upsertInstagramAccount,
} from "@socialbd/db";

import { exchangeForLongLivedToken, fetchFacebookPages } from "./client";import { getMetaScopeString } from "./scopes";
>>>>>>> 4d6e2ef9950540f1b3bcc52875ef8b65928e1ff8

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
<<<<<<< HEAD
=======
  await assertChannelCapacity(input.organizationId, await countNewMetaConnections(input.organizationId, pages));
>>>>>>> 4d6e2ef9950540f1b3bcc52875ef8b65928e1ff8
  const requestedScopes = getMetaScopeString();
  let instagramCount = 0;

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

    const ig = page.instagram_business_account;
    if (ig?.id) {
      instagramCount += 1;
      await upsertInstagramAccount({
        organizationId: input.organizationId,
        igUserId: ig.id,
        displayName: ig.username ? `@${ig.username}` : `${page.name} on Instagram`,
        username: ig.username ?? null,
        pictureUrl: ig.profile_picture_url ?? page.picture?.data?.url ?? null,
        pageAccessToken: page.access_token,
        linkedPageId: page.id,
        tokenExpiresAt,
        scopes,
      });
    }
  }

  return { pageCount: pages.length, instagramCount };
}
