export type MetaErrorKind = "permission" | "expired" | "unknown";

export class MetaApiError extends Error {
  readonly kind: MetaErrorKind;
  readonly code?: number;
  readonly subcode?: number;

  constructor(message: string, kind: MetaErrorKind, code?: number, subcode?: number) {
    super(message);
    this.name = "MetaApiError";
    this.kind = kind;
    this.code = code;
    this.subcode = subcode;
  }
}

export function classifyMetaErrorMessage(message: string, code?: number, subcode?: number): MetaErrorKind {
  const lower = message.toLowerCase();

  if (
    code === 190 ||
    subcode === 463 ||
    subcode === 467 ||
    lower.includes("expired") ||
    lower.includes("invalid oauth") ||
    lower.includes("session has been invalidated")
  ) {
    return "expired";
  }

  if (
    code === 10 ||
    code === 200 ||
    lower.includes("pages_read_engagement") ||
    lower.includes("page public content access") ||
    lower.includes("permission") ||
    lower.includes("does not have permission")
  ) {
    return "permission";
  }

  return "unknown";
}

export function userMessageForMetaError(error: unknown) {
  if (error instanceof MetaApiError) {
    if (error.kind === "permission") {
      return "Missing Meta permission on this Page token. Add pages_read_engagement to your Login configuration, then disconnect and reconnect the Page under Accounts.";
    }
    if (error.kind === "expired") {
      return "Page access token expired. Disconnect and reconnect the Page under Accounts.";
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Meta API request failed.";
}
