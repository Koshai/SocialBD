export function getLinkedInScopeString() {
  const scopes = [
    "openid",
    "profile",
    "email",
    "w_organization_social",
    "r_organization_social",
    "rw_organization_admin",
  ];
  return scopes.join(" ");
}
