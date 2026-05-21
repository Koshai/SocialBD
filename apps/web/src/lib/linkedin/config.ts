export function isLinkedInConfigured() {
  return Boolean(process.env.LINKEDIN_CLIENT_ID?.trim() && process.env.LINKEDIN_CLIENT_SECRET?.trim());
}

export function getLinkedInConfig() {
  const clientId = process.env.LINKEDIN_CLIENT_ID?.trim();
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error("LinkedIn app credentials are not configured.");
  }

  return { clientId, clientSecret };
}

/** REST API version header required by LinkedIn. */
export const LINKEDIN_API_VERSION = process.env.LINKEDIN_API_VERSION?.trim() || "202501";
