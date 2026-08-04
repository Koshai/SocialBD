import { createHmac } from "node:crypto";
import { getUserEmailVerificationState } from "@socialbd/db";

import { isEmailSendingConfigured } from "@/lib/send-email";
import { sendEmailVerificationMessage } from "@/lib/verification-email";

/** Match better-auth default basePath (getBaseURL appends this when origin has no path). */
function getAuthBaseURL() {
  const origin = (
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3001"
  ).replace(/\/$/, "");

  try {
    const pathname = new URL(origin).pathname.replace(/\/+$/, "") || "/";
    if (pathname !== "/") return origin;
  } catch {
    // fall through
  }
  return `${origin}/api/auth`;
}

function base64UrlJson(value: Record<string, unknown>) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

/** HS256 JWT compatible with better-auth createEmailVerificationToken / verify-email. */
function createEmailVerificationToken(email: string, expiresInSeconds = 3600) {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is not configured.");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlJson({ alg: "HS256", typ: "JWT" });
  const payload = base64UrlJson({
    email: email.toLowerCase(),
    iat: now,
    exp: now + expiresInSeconds,
  });
  const data = `${header}.${payload}`;
  const signature = createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${signature}`;
}

export type IssueVerificationResult =
  | { status: "sent" }
  | { status: "already_verified" }
  | { status: "accepted" } // unknown / no account — same client message for privacy
  | { status: "misconfigured"; message: string }
  | { status: "failed"; message: string };

/**
 * Issues a better-auth-compatible verification link and sends it via Resend.
 * Unlike Better Auth's send path, errors are returned so the UI can surface them.
 */
export async function issueAndSendVerificationEmail(input: {
  email: string;
  callbackURL?: string;
}): Promise<IssueVerificationResult> {
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { status: "failed", message: "Enter a valid email address." };
  }

  if (!isEmailSendingConfigured() && process.env.NODE_ENV !== "development") {
    return {
      status: "misconfigured",
      message:
        "Email delivery is not configured on the server (RESEND_API_KEY / EMAIL_FROM). Contact support.",
    };
  }

  const row = await getUserEmailVerificationState(email);

  // Avoid account enumeration when there is no user.
  if (!row) {
    return { status: "accepted" };
  }

  if (row.emailVerified) {
    return { status: "already_verified" };
  }

  try {
    const token = createEmailVerificationToken(email);
    const callback = encodeURIComponent(
      input.callbackURL?.startsWith("/") ? input.callbackURL : "/dashboard",
    );
    const url = `${getAuthBaseURL()}/verify-email?token=${token}&callbackURL=${callback}`;
    await sendEmailVerificationMessage({ email: row.email, url });
    return { status: "sent" };
  } catch (error) {
    console.error("[QueueOra email:verification] issueAndSend failed:", error);
    const message =
      error instanceof Error ? error.message : "Could not send verification email.";
    return { status: "failed", message };
  }
}
