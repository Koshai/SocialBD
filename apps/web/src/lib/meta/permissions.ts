export const META_ANALYTICS_SCOPE = "pages_read_engagement";

export function tokenHasScope(scopes: string | null | undefined, scope: string) {
  if (!scopes) return false;
  return scopes
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .includes(scope);
}
