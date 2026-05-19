/**
 * Scopes bundled with the "Manage everything on your Page" use case (required).
 * Enough to list Pages and receive per-Page access tokens via /me/accounts.
 */
export const META_PAGE_SCOPES_REQUIRED = ["pages_show_list", "business_management"] as const;

/**
 * Add these in Meta → your use case → Permissions, then set META_OAUTH_EXTENDED_SCOPES=true.
 * Requesting them before they are enabled on the app causes "Invalid Scopes" on login.
 */
export const META_PAGE_SCOPES_EXTENDED = ["pages_read_engagement", "pages_manage_posts"] as const;

export function getMetaScopeString() {
  const scopes: string[] = [...META_PAGE_SCOPES_REQUIRED];

  if (process.env.META_OAUTH_EXTENDED_SCOPES === "true") {
    scopes.push(...META_PAGE_SCOPES_EXTENDED);
  }

  return scopes.join(",");
}

export function getMetaLoginConfigId() {
  return process.env.META_LOGIN_CONFIG_ID?.trim() || null;
}
