/** Client-visible LinkedIn connect + publish. Off until Community Management API is approved. */
export function isLinkedInFeatureEnabled() {
  return process.env.NEXT_PUBLIC_LINKEDIN_ENABLED === "true";
}

export function isLinkedInPlatform(platform: string) {
  return platform === "linkedin_organization" || platform === "linkedin";
}

export function withoutLinkedInAccounts<T extends { platform: string }>(accounts: T[]): T[] {
  if (isLinkedInFeatureEnabled()) return accounts;
  return accounts.filter((account) => !isLinkedInPlatform(account.platform));
}

export const POST_HISTORY_PLATFORMS = [
  "all",
  "facebook_page",
  "instagram",
  "linkedin_organization",
] as const;

export function postHistoryPlatformOptions() {
  if (isLinkedInFeatureEnabled()) {
    return POST_HISTORY_PLATFORMS;
  }
  return POST_HISTORY_PLATFORMS.filter((id) => id !== "linkedin_organization");
}
