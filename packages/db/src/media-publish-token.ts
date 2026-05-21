import { createHmac, timingSafeEqual } from "node:crypto";

function getSigningSecret() {
  const secret = process.env.BETTER_AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is required for signed media URLs.");
  }
  return secret;
}

export function getAppBaseUrlFromEnv() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.BETTER_AUTH_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

/** Short-lived public URL so Meta can fetch images for Instagram publishing. */
export function createSignedMediaUrl(relativePath: string, ttlMs = 15 * 60 * 1000) {
  const expiresAt = Date.now() + ttlMs;
  const payload = `${relativePath}|${expiresAt}`;
  const signature = createHmac("sha256", getSigningSecret()).update(payload).digest("base64url");
  const token = Buffer.from(`${payload}|${signature}`).toString("base64url");
  return `${getAppBaseUrlFromEnv()}/api/media/publish/${token}`;
}

export function verifySignedMediaToken(token: string) {
  let decoded: string;
  try {
    decoded = Buffer.from(token, "base64url").toString("utf8");
  } catch {
    throw new Error("Invalid media token.");
  }

  const parts = decoded.split("|");
  if (parts.length !== 3) {
    throw new Error("Invalid media token.");
  }

  const [relativePath, expiresRaw, signature] = parts;
  const expiresAt = Number(expiresRaw);
  if (!relativePath || !signature || !Number.isFinite(expiresAt)) {
    throw new Error("Invalid media token.");
  }

  if (Date.now() > expiresAt) {
    throw new Error("Media link expired.");
  }

  const payload = `${relativePath}|${expiresAt}`;
  const expected = createHmac("sha256", getSigningSecret()).update(payload).digest("base64url");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error("Invalid media token.");
  }

  return relativePath;
}
