/** Parent company shown in site footer and legal pages. */
export const LEGAL_PARENT_COMPANY = "FR Partners NY Inc";

/** Default privacy / legal contact addresses (shown on privacy + terms). */
export const DEFAULT_PRIVACY_CONTACT_EMAILS = [
  "syed@queueora.com",
  "syed.r.akbar@gmail.com",
] as const;

/** Legal entity details for privacy policy and developer app review forms. */
export function getLegalEntityName() {
  return process.env.LEGAL_ENTITY_NAME?.trim() || LEGAL_PARENT_COMPANY;
}

/** Site footer copyright line (homepage, privacy, terms). */
export function getSiteCopyrightNotice(year = new Date().getFullYear()) {
  return `© ${year}, QueueOra, a ${LEGAL_PARENT_COMPANY} company`;
}

/**
 * Contact addresses shown on the privacy policy, terms, and Meta app review forms.
 * Prefer PRIVACY_CONTACT_EMAIL when set (comma-separated for multiple); do not fall
 * back to EMAIL_FROM (often a no-reply sender).
 */
export function getPrivacyContactEmails() {
  const direct = process.env.PRIVACY_CONTACT_EMAIL?.trim();
  if (direct) {
    return direct
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);
  }

  return [...DEFAULT_PRIVACY_CONTACT_EMAILS];
}

/** Primary contact (first address) for single-email contexts. */
export function getPrivacyContactEmail() {
  return getPrivacyContactEmails()[0] ?? DEFAULT_PRIVACY_CONTACT_EMAILS[0];
}

export function getPublicSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.BETTER_AUTH_URL ??
    "http://localhost:3001"
  ).replace(/\/$/, "");
}
