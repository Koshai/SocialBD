<<<<<<< HEAD
import { and, eq } from "drizzle-orm";

import { db } from "./db";
import { member } from "./schema/organization";
=======
import { and, eq, inArray, ne } from "drizzle-orm";

import { db } from "./db";
import { user } from "./schema/auth";
import { member, organization } from "./schema/organization";
>>>>>>> 4d6e2ef9950540f1b3bcc52875ef8b65928e1ff8

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
<<<<<<< HEAD
=======

export async function getOrganizationName(organizationId: string) {
  const [row] = await db
    .select({ name: organization.name })
    .from(organization)
    .where(eq(organization.id, organizationId))
    .limit(1);

  return row?.name ?? "Workspace";
}

export async function listOrganizationApproverEmails(
  organizationId: string,
  excludeUserId?: string,
) {
  const conditions = [
    eq(member.organizationId, organizationId),
    inArray(member.role, ["owner", "admin"]),
  ];

  if (excludeUserId) {
    conditions.push(ne(member.userId, excludeUserId));
  }

  const rows = await db
    .select({
      email: user.email,
      name: user.name,
    })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(and(...conditions));

  const seen = new Set<string>();
  const recipients: Array<{ email: string; name: string | null }> = [];

  for (const row of rows) {
    const email = row.email.trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    recipients.push({ email: row.email, name: row.name });
  }

  return recipients;
}

export async function getUserEmailProfile(userId: string) {
  const [row] = await db
    .select({ email: user.email, name: user.name })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!row?.email) return null;
  return { email: row.email, name: row.name };
}
>>>>>>> 4d6e2ef9950540f1b3bcc52875ef8b65928e1ff8
