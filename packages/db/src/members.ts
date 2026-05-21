import { and, eq } from "drizzle-orm";

import { db } from "./db";
import { member } from "./schema/organization";

export type OrganizationRole = "owner" | "admin" | "member";

export async function userBelongsToOrganization(userId: string, organizationId: string) {
  const [row] = await db
    .select({ id: member.id })
    .from(member)
    .where(and(eq(member.organizationId, organizationId), eq(member.userId, userId)))
    .limit(1);

  return Boolean(row);
}

export async function getOrganizationMemberRole(
  userId: string,
  organizationId: string,
): Promise<OrganizationRole | null> {
  const [row] = await db
    .select({ role: member.role })
    .from(member)
    .where(and(eq(member.organizationId, organizationId), eq(member.userId, userId)))
    .limit(1);

  const role = row?.role;
  if (role === "owner" || role === "admin" || role === "member") {
    return role;
  }
  return role ? "member" : null;
}

export function canPublishWithoutApproval(role: OrganizationRole | null) {
  return role === "owner" || role === "admin";
}
