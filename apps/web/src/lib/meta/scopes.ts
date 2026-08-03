export const META_PAGE_SCOPES_REQUIRED = ["pages_show_list", "business_management"] as const;

export const META_PAGE_SCOPES_EXTENDED = ["pages_read_engagement", "pages_manage_posts"] as const;

export const META_INSTAGRAM_SCOPES = ["instagram_basic", "instagram_content_publish"] as const;

/**
 * Messaging / comment auto-reply. Enable with META_OAUTH_MESSAGING=true after adding
 * these permissions in Meta App Review / Login configuration.
 */
export const META_MESSAGING_SCOPES = [
  "pages_messaging",
  "pages_manage_engagement",
  "pages_manage_metadata",
] as const;

export const META_INSTAGRAM_MESSAGING_SCOPES = [
  "instagram_manage_messages",
  "instagram_manage_comments",
] as const;

export function getMetaScopeString() {
  const scopes: string[] = [...META_PAGE_SCOPES_REQUIRED];

  if (process.env.META_OAUTH_EXTENDED_SCOPES === "true") {
    scopes.push(...META_PAGE_SCOPES_EXTENDED);
  }

  if (process.env.META_OAUTH_INSTAGRAM === "true") {
    scopes.push(...META_INSTAGRAM_SCOPES);
  }

  if (process.env.META_OAUTH_MESSAGING === "true") {
    scopes.push(...META_MESSAGING_SCOPES);
    if (process.env.META_OAUTH_INSTAGRAM === "true") {
      scopes.push(...META_INSTAGRAM_MESSAGING_SCOPES);
    }
  }

  return scopes.join(",");
}

export function getMetaLoginConfigId() {
  return process.env.META_LOGIN_CONFIG_ID?.trim() || null;
}

export function isMetaMessagingOAuthEnabled() {
  return process.env.META_OAUTH_MESSAGING === "true";
}
