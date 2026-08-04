import { and, count, eq, inArray, ne } from "drizzle-orm";

import { db } from "./db";
import { user } from "./schema/auth";
import { member, organization } from "./schema/organization";

export type OrganizationRole = "owner" | "admin" | "member";

/** Better Auth may store a single role or a comma-separated list. */
export function parseOrganizationRoles(role: string | null | undefined): OrganizationRole[] {
  if (!role?.trim()) return [];
  const out: OrganizationRole[] = [];
  for (const part of role.split(/[,|]/).map((item) => item.trim().toLowerCase())) {
    if (part === "owner" || part === "admin" || part === "member") {
      if (!out.includes(part)) out.push(part);
    }
  }
  return out;
}

export function highestOrganizationRole(role: string | null | undefined): OrganizationRole | null {
  const roles = parseOrganizationRoles(role);
  if (roles.includes("owner")) return "owner";
  if (roles.includes("admin")) return "admin";
  if (roles.includes("member")) return "member";
  return null;
}

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

  return highestOrganizationRole(row?.role ?? null);
}

export function canPublishWithoutApproval(role: OrganizationRole | null) {
  return role === "owner" || role === "admin";
}

/** Solo workspaces: the only member can always publish (no second approver needed). */
export async function isSoleOrganizationMember(userId: string, organizationId: string) {
  const [totals] = await db
    .select({ total: count() })
    .from(member)
    .where(eq(member.organizationId, organizationId));

  if ((totals?.total ?? 0) !== 1) return false;
  return userBelongsToOrganization(userId, organizationId);
}

/**
 * Owners/admins publish directly. A sole member (typical for a new solo workspace)
 * can also publish, so posts are not stuck waiting for an approver who does not exist.
 */
export async function userCanPublishDirectly(userId: string, organizationId: string) {
  const role = await getOrganizationMemberRole(userId, organizationId);
  if (canPublishWithoutApproval(role)) return true;
  if (!role) return false;
  if (!(await isSoleOrganizationMember(userId, organizationId))) return false;
  // Self-heal: sole member stuck as "member" becomes owner so Approvals / invites work too.
  await ensureSoleMembersAreOwners(organizationId);
  return true;
}

export async function ensureSoleMembersAreOwners(organizationId?: string) {
  const memberships = organizationId
    ? await db
        .select({
          id: member.id,
          organizationId: member.organizationId,
          userId: member.userId,
          role: member.role,
        })
        .from(member)
        .where(eq(member.organizationId, organizationId))
    : await db
        .select({
          id: member.id,
          organizationId: member.organizationId,
          userId: member.userId,
          role: member.role,
        })
        .from(member);

  const byOrg = new Map<string, typeof memberships>();
  for (const row of memberships) {
    const list = byOrg.get(row.organizationId) ?? [];
    list.push(row);
    byOrg.set(row.organizationId, list);
  }

  let updated = 0;
  for (const [, rows] of byOrg) {
    if (rows.length !== 1) continue;
    const only = rows[0]!;
    if (canPublishWithoutApproval(highestOrganizationRole(only.role))) continue;
    await db.update(member).set({ role: "owner" }).where(eq(member.id, only.id));
    updated += 1;
  }
  return updated;
}

export async function getUserEmailVerificationState(email: string) {
  const normalized = email.trim().toLowerCase();
  const [found] = await db
    .select({
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
    })
    .from(user)
    .where(eq(user.email, normalized))
    .limit(1);

  if (found) return found;

  // Case-insensitive fallback if legacy rows store mixed case
  const all = await db
    .select({
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
    })
    .from(user);
  return all.find((row) => row.email.toLowerCase() === normalized) ?? null;
}

export async function promoteUserToOwnerByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const [found] = await db
    .select({ id: user.id, email: user.email, name: user.name })
    .from(user)
    .where(eq(user.email, normalized))
    .limit(1);

  if (!found) {
    // Case-insensitive fallback
    const all = await db.select({ id: user.id, email: user.email, name: user.name }).from(user);
    const match = all.find((row) => row.email.toLowerCase() === normalized);
    if (!match) return { user: null, updated: 0 as number, memberships: [] as Array<{ organizationId: string; role: string }> };
    return promoteUserIdToOwner(match.id);
  }

  return promoteUserIdToOwner(found.id);
}

async function promoteUserIdToOwner(userId: string) {
  const memberships = await db
    .select({
      id: member.id,
      organizationId: member.organizationId,
      role: member.role,
    })
    .from(member)
    .where(eq(member.userId, userId));

  let updated = 0;
  for (const row of memberships) {
    if (highestOrganizationRole(row.role) === "owner") continue;
    await db.update(member).set({ role: "owner" }).where(eq(member.id, row.id));
    updated += 1;
  }

  const [profile] = await db
    .select({ id: user.id, email: user.email, name: user.name })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  const after = await db
    .select({ organizationId: member.organizationId, role: member.role })
    .from(member)
    .where(eq(member.userId, userId));

  return { user: profile ?? null, updated, memberships: after };
}

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
  // Approvers are owners/admins; if none (only members), include all members so email can still go somewhere optional.
  const conditions = [
    eq(member.organizationId, organizationId),
    inArray(member.role, ["owner", "admin"]),
  ];

  if (excludeUserId) {
    conditions.push(ne(member.userId, excludeUserId));
  }

  let rows = await db
    .select({
      email: user.email,
      name: user.name,
    })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(and(...conditions));

  // Fallback: roles that embed "owner"/"admin" in multi-role strings are missed by inArray.
  if (rows.length === 0) {
    const allMembers = await db
      .select({
        email: user.email,
        name: user.name,
        role: member.role,
        userId: member.userId,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .where(eq(member.organizationId, organizationId));

    rows = allMembers
      .filter((row) => canPublishWithoutApproval(highestOrganizationRole(row.role)))
      .filter((row) => !excludeUserId || row.userId !== excludeUserId)
      .map(({ email, name }) => ({ email, name }));
  }

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
