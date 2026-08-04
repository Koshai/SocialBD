import { NextResponse } from "next/server";

import { issueAndSendVerificationEmail } from "@/lib/issue-verification-email";

export const runtime = "nodejs";

const lastSentAt = new Map<string, number>();
const COOLDOWN_MS = 45_000;

type Body = {
  email?: string;
  callbackURL?: string;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const now = Date.now();
  const previous = lastSentAt.get(email) ?? 0;
  if (now - previous < COOLDOWN_MS) {
    const waitSec = Math.ceil((COOLDOWN_MS - (now - previous)) / 1000);
    return NextResponse.json(
      {
        error: `Please wait ${waitSec}s before requesting another verification email.`,
      },
      { status: 429 },
    );
  }

  const callbackURL =
    body.callbackURL && body.callbackURL.startsWith("/") && !body.callbackURL.startsWith("//")
      ? body.callbackURL
      : "/dashboard";

  const result = await issueAndSendVerificationEmail({ email, callbackURL });

  if (result.status === "failed" || result.status === "misconfigured") {
    return NextResponse.json({ error: result.message }, { status: 502 });
  }

  lastSentAt.set(email, now);

  if (result.status === "already_verified") {
    return NextResponse.json({
      ok: true,
      alreadyVerified: true,
      message: "This email is already verified. You can sign in.",
    });
  }

  // "sent" and "accepted" (unknown email) share the same success copy.
  return NextResponse.json({
    ok: true,
    message:
      "If an account exists for that email and still needs verification, we sent a link. Check your inbox and spam folder.",
  });
}
