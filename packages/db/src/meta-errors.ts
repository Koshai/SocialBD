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
    lower.includes("pages_read_engagement") ||
    lower.includes("page public content access") ||
    lower.includes("does not have permission") ||
    (code === 200 &&
      (lower.includes("permission") ||
        lower.includes("pages_read_engagement") ||
        lower.includes("page public content access")))
  ) {
    return "permission";
  }

  return "unknown";
}

export type MetaErrorMessageContext = {
  hasEngagementScope?: boolean;
  channelName?: string;
};

export function userMessageForMetaError(error: unknown, context?: MetaErrorMessageContext) {
  if (error instanceof MetaApiError) {
    if (error.kind === "permission") {
      if (context?.hasEngagementScope) {
        const page = context.channelName ? ` on ${context.channelName}` : "";
        return `Meta could not load engagement for this post${page}. Your Page token includes pages_read_engagement, but Meta still blocked the request (${error.message}). This often means your app needs Advanced Access for that permission, or Page Public Content Access under App Review — even for posts on Pages you manage.`;
      }
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
