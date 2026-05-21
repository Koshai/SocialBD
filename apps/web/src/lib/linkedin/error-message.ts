import type { TranslateFn } from "@/lib/i18n/translate";

const LINKEDIN_ERROR_CODES = [
  "linkedin_not_configured",
  "linkedin_denied",
  "linkedin_invalid_callback",
  "linkedin_invalid_state",
  "linkedin_no_organizations",
  "linkedin_sync_failed",
] as const;

type LinkedInErrorCode = (typeof LINKEDIN_ERROR_CODES)[number];

function isLinkedInErrorCode(value: string): value is LinkedInErrorCode {
  return (LINKEDIN_ERROR_CODES as readonly string[]).includes(value);
}

export function getLinkedInErrorMessage(error: string, t: TranslateFn): string {
  if (!isLinkedInErrorCode(error)) {
    return t("accounts.linkedinErrorDefault");
  }

  switch (error) {
    case "linkedin_not_configured":
      return t("accounts.linkedinErrors.linkedin_not_configured");
    case "linkedin_denied":
      return t("accounts.linkedinErrors.linkedin_denied");
    case "linkedin_invalid_callback":
      return t("accounts.linkedinErrors.linkedin_invalid_callback");
    case "linkedin_invalid_state":
      return t("accounts.linkedinErrors.linkedin_invalid_state");
    case "linkedin_no_organizations":
      return t("accounts.linkedinErrors.linkedin_no_organizations");
    case "linkedin_sync_failed":
      return t("accounts.linkedinErrors.linkedin_sync_failed");
    default:
      return t("accounts.linkedinErrorDefault");
  }
}
