import { getLinkedInConfig, LINKEDIN_API_VERSION } from "./config";
import { getLinkedInScopeString } from "./scopes";

type TokenResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
};

type RestliCollection<T> = {
  elements?: T[];
  paging?: { start?: number; count?: number; total?: number };
};

type OrganizationAcl = {
  organization: string;
  role: string;
  state: string;
};

type OrganizationDetails = {
  id: number;
  localizedName?: string;
  vanityName?: string;
  logoV2?: {
    original?: string;
    "original~": { elements?: Array<{ identifiers?: Array<{ identifier?: string }> }> };
  };
};

const LINKEDIN_REST_BASE = "https://api.linkedin.com/rest";
const LINKEDIN_OAUTH_BASE = "https://www.linkedin.com/oauth/v2";

function linkedInHeaders(accessToken: string, extra?: Record<string, string>) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "LinkedIn-Version": LINKEDIN_API_VERSION,
    "X-Restli-Protocol-Version": "2.0.0",
    ...extra,
  };
}

async function linkedInRestGet<T>(path: string, accessToken: string) {
  const response = await fetch(`${LINKEDIN_REST_BASE}${path}`, {
    headers: linkedInHeaders(accessToken),
    cache: "no-store",
  });

  const text = await response.text();
  let json: T;
  try {
    json = text ? (JSON.parse(text) as T) : ({} as T);
  } catch {
    throw new Error(`LinkedIn API returned invalid JSON (${response.status}).`);
  }

  if (!response.ok) {
    const message =
      typeof json === "object" && json !== null && "message" in json
        ? String((json as { message: unknown }).message)
        : `LinkedIn API request failed (${response.status}).`;
    throw new Error(message);
  }

  return json;
}

export function buildLinkedInAuthorizeUrl(state: string, redirectUri: string) {
  const { clientId } = getLinkedInConfig();
  const url = new URL(`${LINKEDIN_OAUTH_BASE}/authorization`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("scope", getLinkedInScopeString());
  return url.toString();
}

export async function exchangeLinkedInCode(code: string, redirectUri: string) {
  const { clientId, clientSecret } = getLinkedInConfig();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(`${LINKEDIN_OAUTH_BASE}/accessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  const json = (await response.json()) as TokenResponse & { error_description?: string };
  if (!response.ok || !json.access_token) {
    throw new Error(json.error_description ?? `LinkedIn token exchange failed (${response.status}).`);
  }

  return json;
}

const POSTING_ROLES = new Set([
  "ADMINISTRATOR",
  "CONTENT_ADMINISTRATOR",
  "DIRECT_SPONSORED_CONTENT_POSTER",
]);

export function parseOrganizationUrn(urn: string) {
  const match = /^urn:li:organization:(\d+)$/.exec(urn);
  return match?.[1] ?? null;
}

export async function fetchAdministeredOrganizations(accessToken: string) {
  const data = await linkedInRestGet<RestliCollection<OrganizationAcl>>(
    "/organizationAcls?q=roleAssignee",
    accessToken,
  );

  const elements = data.elements ?? [];
  const orgUrns = new Set<string>();

  for (const row of elements) {
    if (row.state !== "APPROVED") continue;
    if (!POSTING_ROLES.has(row.role)) continue;
    if (row.organization) orgUrns.add(row.organization);
  }

  return [...orgUrns];
}

export async function fetchOrganizationDetails(organizationId: string, accessToken: string) {
  return linkedInRestGet<OrganizationDetails>(`/organizations/${organizationId}`, accessToken);
}

export function organizationLogoUrl(details: OrganizationDetails) {
  const elements = details.logoV2?.["original~"]?.elements;
  const identifier = elements?.[0]?.identifiers?.[0]?.identifier;
  return identifier ?? null;
}
