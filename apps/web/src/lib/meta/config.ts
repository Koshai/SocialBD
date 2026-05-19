const GRAPH_VERSION = "v21.0";

export function getMetaGraphVersion() {
  return GRAPH_VERSION;
}

export function getMetaGraphBaseUrl() {
  return `https://graph.facebook.com/${GRAPH_VERSION}`;
}

export function getMetaConfig(redirectUri?: string) {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const resolvedRedirectUri =
    redirectUri ??
    process.env.META_REDIRECT_URI ??
    `${process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/meta/callback`;

  return { appId, appSecret, redirectUri: resolvedRedirectUri };
}

export function isMetaConfigured() {
  const { appId, appSecret } = getMetaConfig();
  return Boolean(appId && appSecret);
}
