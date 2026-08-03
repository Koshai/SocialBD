import {
  canPublishWithoutApproval,
  getOrganizationMemberRole,
  userCanPublishDirectly,
  type OrganizationRole,
} from "@socialbd/db";

export type { OrganizationRole };

export async function getMemberRoleForUser(userId: string, organizationId: string) {
  return getOrganizationMemberRole(userId, organizationId);
}

export function canPublishDirectly(role: OrganizationRole | null) {
  return canPublishWithoutApproval(role);
}

/** Preferred: includes sole-member workspaces so solo owners are not stuck in approval. */
export async function resolveCanPublishDirectly(userId: string, organizationId: string) {
  return userCanPublishDirectly(userId, organizationId);
}
