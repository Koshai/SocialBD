/** Legal entity details for privacy policy and developer app review forms. */
export function getLegalEntityName() {
  return process.env.LEGAL_ENTITY_NAME?.trim() || "SocialBD";
}

export function getPrivacyContactEmail() {
  const direct = process.env.PRIVACY_CONTACT_EMAIL?.trim();
  if (direct) return direct;

  const from = process.env.EMAIL_FROM?.trim();
  if (from) {
    const match = /<([^>]+)>/.exec(from);
    if (match?.[1]) return match[1];
    if (from.includes("@")) return from;
  }

  return "privacy@socialbd.com";
}

export function getPublicSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.BETTER_AUTH_URL ??
    "http://localhost:3001"
  ).replace(/\/$/, "");
}
