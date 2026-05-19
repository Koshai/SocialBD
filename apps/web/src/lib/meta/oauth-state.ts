import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "meta_oauth_state";
const MAX_AGE_SECONDS = 600;

type OAuthStatePayload = {
  organizationId: string;
  userId: string;
  nonce: string;
};

function getStateSecret() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is required for OAuth state signing.");
  }
  return secret;
}

function signPayload(encoded: string) {
  return createHmac("sha256", getStateSecret()).update(encoded).digest("base64url");
}

export function createOAuthState(payload: Omit<OAuthStatePayload, "nonce">) {
  const value: OAuthStatePayload = {
    ...payload,
    nonce: randomBytes(16).toString("hex"),
  };
  const encoded = Buffer.from(JSON.stringify(value)).toString("base64url");
  const signature = signPayload(encoded);
  return `${encoded}.${signature}`;
}

export function verifyOAuthState(state: string): OAuthStatePayload | null {
  const [encoded, signature] = state.split(".");
  if (!encoded || !signature) return null;

  const expected = signPayload(encoded);
  const actual = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (actual.length !== expectedBuf.length || !timingSafeEqual(actual, expectedBuf)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as OAuthStatePayload;
  } catch {
    return null;
  }
}

export function getOAuthStateCookieOptions() {
  return {
    name: COOKIE_NAME,
    maxAge: MAX_AGE_SECONDS,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

export function getOAuthStateCookieName() {
  return COOKIE_NAME;
}
