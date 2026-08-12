/** Parent company shown in site footer and legal pages. */
export const LEGAL_PARENT_COMPANY = "FR Partners NY Inc";

/** Legal entity details for privacy policy and developer app review forms. */
export function getLegalEntityName() {
  return process.env.LEGAL_ENTITY_NAME?.trim() || LEGAL_PARENT_COMPANY;
}

/** Site footer copyright line (homepage, privacy, terms). */
export function getSiteCopyrightNotice(year = new Date().getFullYear()) {
  return `© ${year}, QueueOra, a ${LEGAL_PARENT_COMPANY} company`;
}

/**
 * Contact address shown on the privacy policy and for Meta app review forms.
 * Prefer PRIVACY_CONTACT_EMAIL when set; do not fall back to EMAIL_FROM
 * (often a no-reply sender).
 */
export function getPrivacyContactEmail() {
  const direct = process.env.PRIVACY_CONTACT_EMAIL?.trim();
  if (direct) return direct;

  // Temporary operator email until privacy@queueora.com is provisioned.
  return "syed.r.akbar@gmail.com";
}

export function getPublicSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.BETTER_AUTH_URL ??
    "http://localhost:3001"
  ).replace(/\/$/, "");
}
