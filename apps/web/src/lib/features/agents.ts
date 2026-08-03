/** Client-visible AI reply agents for Facebook / Instagram. */
export function isAgentsFeatureEnabled() {
  return process.env.NEXT_PUBLIC_AGENTS_ENABLED === "true";
}
