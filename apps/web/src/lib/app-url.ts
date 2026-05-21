export function getRequestOrigin(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "http";

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return new URL(request.url).origin;
}

export function getAppBaseUrl(request?: Request) {
  if (request) {
    return getRequestOrigin(request);
  }

  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.BETTER_AUTH_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

/**
 * OAuth redirect URI must match the authorize request and Meta app settings.
 * In development, uses the request origin when it differs from META_REDIRECT_URI
 * so port 3001 vs 3000 mismatches do not 404 the callback.
 */
export function getLinkedInRedirectUri(request: Request) {
  const requestOrigin = getRequestOrigin(request);
  const envUri = process.env.LINKEDIN_REDIRECT_URI?.trim();

  if (envUri) {
    const envOrigin = new URL(envUri).origin;
    if (process.env.NODE_ENV === "development" && envOrigin !== requestOrigin) {
      console.warn(
        `[linkedin] LINKEDIN_REDIRECT_URI (${envUri}) does not match dev server (${requestOrigin}). ` +
          `Using ${requestOrigin}/api/linkedin/callback — add this URI in LinkedIn app settings.`,
      );
      return `${requestOrigin}/api/linkedin/callback`;
    }
    return envUri;
  }

  return `${requestOrigin}/api/linkedin/callback`;
}

export function getMetaRedirectUri(request: Request) {
  const requestOrigin = getRequestOrigin(request);
  const envUri = process.env.META_REDIRECT_URI?.trim();

  if (envUri) {
    const envOrigin = new URL(envUri).origin;
    if (process.env.NODE_ENV === "development" && envOrigin !== requestOrigin) {
      console.warn(
        `[meta] META_REDIRECT_URI (${envUri}) does not match dev server (${requestOrigin}). ` +
          `Using ${requestOrigin}/api/meta/callback — add this URI in Meta app settings.`,
      );
      return `${requestOrigin}/api/meta/callback`;
    }
    return envUri;
  }

  return `${requestOrigin}/api/meta/callback`;
}

export function appUrl(request: Request, pathname: string, params?: Record<string, string>) {
  const url = new URL(pathname, getAppBaseUrl(request));
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return url;
}
