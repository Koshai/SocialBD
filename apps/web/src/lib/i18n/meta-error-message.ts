import type { TranslateFn } from "./translate";

const META_ERROR_CODES = [
  "meta_not_configured",
  "meta_denied",
  "meta_invalid_callback",
  "meta_invalid_state",
  "meta_no_pages",
  "meta_sync_failed",
] as const;

type MetaErrorCode = (typeof META_ERROR_CODES)[number];

function isMetaErrorCode(value: string): value is MetaErrorCode {
  return (META_ERROR_CODES as readonly string[]).includes(value);
}

export function getMetaErrorMessage(error: string, t: TranslateFn): string {
  if (!isMetaErrorCode(error)) {
    return t("accounts.metaErrorDefault");
  }

  switch (error) {
    case "meta_not_configured":
      return t("accounts.metaErrors.meta_not_configured");
    case "meta_denied":
      return t("accounts.metaErrors.meta_denied");
    case "meta_invalid_callback":
      return t("accounts.metaErrors.meta_invalid_callback");
    case "meta_invalid_state":
      return t("accounts.metaErrors.meta_invalid_state");
    case "meta_no_pages":
      return t("accounts.metaErrors.meta_no_pages");
    case "meta_sync_failed":
      return t("accounts.metaErrors.meta_sync_failed");
    default:
      return t("accounts.metaErrorDefault");
  }
}
