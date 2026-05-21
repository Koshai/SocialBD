import { getMetaConfig, getMetaGraphBaseUrl } from "./config";
import { getMetaLoginConfigId, getMetaScopeString } from "./scopes";

type TokenResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
};

type InstagramBusinessAccount = {
  id: string;
  username?: string;
  profile_picture_url?: string;
};

type FacebookPage = {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  username?: string;
  picture?: { data?: { url?: string } };
  instagram_business_account?: InstagramBusinessAccount;
};

type AccountsResponse = {
  data?: FacebookPage[];
  error?: { message: string; type: string; code: number };
};

async function graphGet<T>(path: string, params: Record<string, string>) {
  const url = new URL(`${getMetaGraphBaseUrl()}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, { cache: "no-store" });
  const json = (await response.json()) as T & { error?: { message: string } };

  if (!response.ok || json.error) {
    throw new Error(json.error?.message ?? `Meta API request failed (${response.status}).`);
  }

  return json;
}

export async function exchangeCodeForToken(code: string, redirectUri: string) {
  const { appId, appSecret } = getMetaConfig(redirectUri);
  if (!appId || !appSecret) {
    throw new Error("Meta app credentials are not configured.");
  }

  return graphGet<TokenResponse>("/oauth/access_token", {
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  });
}

export async function exchangeForLongLivedToken(shortLivedToken: string) {
  const { appId, appSecret } = getMetaConfig();
  if (!appId || !appSecret) {
    throw new Error("Meta app credentials are not configured.");
  }

  return graphGet<TokenResponse>("/oauth/access_token", {
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortLivedToken,
  });
}

export async function fetchFacebookPages(userAccessToken: string) {
  const result = await graphGet<AccountsResponse>("/me/accounts", {
    access_token: userAccessToken,
    fields:
      "id,name,access_token,category,username,picture,instagram_business_account{id,username,profile_picture_url}",
  });

  return result.data ?? [];
}

export function buildMetaAuthorizeUrl(state: string, redirectUri: string) {
  const { appId } = getMetaConfig(redirectUri);
  if (!appId) {
    throw new Error("META_APP_ID is not configured.");
  }

  const url = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");

  const configId = getMetaLoginConfigId();
  if (configId) {
    // Facebook Login for Business: permissions come from the dashboard configuration.
    url.searchParams.set("config_id", configId);
  } else {
    url.searchParams.set("scope", getMetaScopeString());
  }

  return url.toString();
}
