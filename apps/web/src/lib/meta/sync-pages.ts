import {
  assertChannelCapacity,
  countNewMetaConnections,
  debugTokenScopes,
  subscribePageToApp,
  upsertFacebookPageAccount,
  upsertInstagramAccount,
} from "@socialbd/db";

import { exchangeForLongLivedToken, fetchFacebookPages } from "./client";
import { getMetaScopeString, isMetaMessagingOAuthEnabled } from "./scopes";

function formatPageSubscribeError(pageId: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("#200") || /administrative permission|Two Factor/i.test(message)) {
    return (
      `[meta] Page ${pageId}: cannot enable message webhooks — the connecting user needs full Page admin ` +
      `(MESSAGING / MANAGE) and 2FA on that Facebook account if the Page requires it. ${message}`
    );
  }
  return `[meta] Could not subscribe page ${pageId} to webhooks: ${message}`;
}

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
  await assertChannelCapacity(input.organizationId, await countNewMetaConnections(input.organizationId, pages));
  const requestedScopes = getMetaScopeString();
  let instagramCount = 0;
  let pagesSubscribed = 0;
  let pagesSubscribeFailed = 0;

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

    if (isMetaMessagingOAuthEnabled()) {
      try {
        await subscribePageToApp({
          pageId: page.id,
          pageAccessToken: page.access_token,
        });
        pagesSubscribed += 1;
      } catch (error) {
        pagesSubscribeFailed += 1;
        console.warn(formatPageSubscribeError(page.id, error));
      }
    }

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

  if (isMetaMessagingOAuthEnabled() && instagramCount > 0) {
    // Instagram messaging webhooks are configured only in Meta App Dashboard, not Graph API.
    console.info(
      `[meta] ${instagramCount} Instagram account(s) linked. ` +
        `For IG DMs: Meta App Dashboard → Webhooks → Instagram → subscribe "messages" ` +
        `(callback https://queueora.com/api/meta/webhook). ` +
        `Page subscriptions: ${pagesSubscribed} ok, ${pagesSubscribeFailed} failed.`,
    );
  }

  return { pageCount: pages.length, instagramCount };
}
