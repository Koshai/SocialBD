import {
  canPublishWithoutApproval,
  getOrganizationMemberRole,
  type OrganizationRole,
} from "@socialbd/db";

export type { OrganizationRole };

export async function getMemberRoleForUser(userId: string, organizationId: string) {
  return getOrganizationMemberRole(userId, organizationId);
}

export function canPublishDirectly(role: OrganizationRole | null) {
  return canPublishWithoutApproval(role);
}
