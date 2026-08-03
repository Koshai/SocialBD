import { and, asc, eq, sql } from "drizzle-orm";

import { db } from "./db";
import { connectedAccount } from "./schema/connected-account";

export type PublicConnectedAccount = {
  id: string;
  platform: string;
  providerAccountId: string;
  displayName: string;
  username: string | null;
  pictureUrl: string | null;
  status: string;
  scopes: string | null;
  createdAt: Date;
};

function toPublic(row: typeof connectedAccount.$inferSelect): PublicConnectedAccount {
  return {
    id: row.id,
    platform: row.platform,
    providerAccountId: row.providerAccountId,
    displayName: row.displayName,
    username: row.username,
    pictureUrl: row.pictureUrl,
    status: row.status,
    scopes: row.scopes,
    createdAt: row.createdAt,
  };
}

export async function listConnectedAccounts(organizationId: string) {
  const rows = await db
    .select()
    .from(connectedAccount)
    .where(eq(connectedAccount.organizationId, organizationId))
    .orderBy(asc(connectedAccount.displayName));

  return rows.map(toPublic);
}

export async function countConnectedAccounts(organizationId: string) {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(connectedAccount)
    .where(
      and(eq(connectedAccount.organizationId, organizationId), eq(connectedAccount.status, "active")),
    );

  return result?.count ?? 0;
}

export async function upsertFacebookPageAccount(input: {
  organizationId: string;
  pageId: string;
  displayName: string;
  username?: string | null;
  pictureUrl?: string | null;
  accessToken: string;
  tokenExpiresAt?: Date | null;
  scopes: string;
}) {
  const now = new Date();
  const id = crypto.randomUUID();

  await db
    .insert(connectedAccount)
    .values({
      id,
      organizationId: input.organizationId,
      platform: "facebook_page",
      providerAccountId: input.pageId,
      displayName: input.displayName,
      username: input.username ?? null,
      pictureUrl: input.pictureUrl ?? null,
      accessToken: input.accessToken,
      tokenExpiresAt: input.tokenExpiresAt ?? null,
      scopes: input.scopes,
      status: "active",
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        connectedAccount.organizationId,
        connectedAccount.platform,
        connectedAccount.providerAccountId,
      ],
      set: {
        displayName: input.displayName,
        username: input.username ?? null,
        pictureUrl: input.pictureUrl ?? null,
        accessToken: input.accessToken,
        tokenExpiresAt: input.tokenExpiresAt ?? null,
        scopes: input.scopes,
        status: "active",
        updatedAt: now,
      },
    });
}

/** Keep handle + linked Page so agents/webhooks can resolve Page id for IG DMs. */
function igUsernameWithLinkedPage(username: string | null | undefined, linkedPageId: string) {
  const handle = username?.trim().replace(/^@/, "") || null;
  if (handle) return `${handle}|page:${linkedPageId}`;
  return `page:${linkedPageId}`;
}

export async function upsertInstagramAccount(input: {
  organizationId: string;
  igUserId: string;
  displayName: string;
  username?: string | null;
  pictureUrl?: string | null;
  pageAccessToken: string;
  linkedPageId: string;
  tokenExpiresAt?: Date | null;
  scopes: string;
}) {
  const now = new Date();
  const id = crypto.randomUUID();
  const username = igUsernameWithLinkedPage(input.username, input.linkedPageId);

  await db
    .insert(connectedAccount)
    .values({
      id,
      organizationId: input.organizationId,
      platform: "instagram",
      providerAccountId: input.igUserId,
      displayName: input.displayName,
      username,
      pictureUrl: input.pictureUrl ?? null,
      accessToken: input.pageAccessToken,
      tokenExpiresAt: input.tokenExpiresAt ?? null,
      scopes: input.scopes,
      status: "active",
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        connectedAccount.organizationId,
        connectedAccount.platform,
        connectedAccount.providerAccountId,
      ],
      set: {
        displayName: input.displayName,
        username,
        pictureUrl: input.pictureUrl ?? null,
        accessToken: input.pageAccessToken,
        tokenExpiresAt: input.tokenExpiresAt ?? null,
        scopes: input.scopes,
        status: "active",
        updatedAt: now,
      },
    });
}

export async function upsertLinkedInOrganizationAccount(input: {
  organizationId: string;
  linkedInOrganizationId: string;
  displayName: string;
  vanityName?: string | null;
  pictureUrl?: string | null;
  accessToken: string;
  tokenExpiresAt?: Date | null;
  scopes: string;
}) {
  const now = new Date();
  const id = crypto.randomUUID();

  await db
    .insert(connectedAccount)
    .values({
      id,
      organizationId: input.organizationId,
      platform: "linkedin_organization",
      providerAccountId: input.linkedInOrganizationId,
      displayName: input.displayName,
      username: input.vanityName ?? null,
      pictureUrl: input.pictureUrl ?? null,
      accessToken: input.accessToken,
      tokenExpiresAt: input.tokenExpiresAt ?? null,
      scopes: input.scopes,
      status: "active",
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        connectedAccount.organizationId,
        connectedAccount.platform,
        connectedAccount.providerAccountId,
      ],
      set: {
        displayName: input.displayName,
        username: input.vanityName ?? null,
        pictureUrl: input.pictureUrl ?? null,
        accessToken: input.accessToken,
        tokenExpiresAt: input.tokenExpiresAt ?? null,
        scopes: input.scopes,
        status: "active",
        updatedAt: now,
      },
    });
}

export async function disconnectAccount(input: { accountId: string; organizationId: string }) {
  const [deleted] = await db
    .delete(connectedAccount)
    .where(
      and(
        eq(connectedAccount.id, input.accountId),
        eq(connectedAccount.organizationId, input.organizationId),
      ),
    )
    .returning({ id: connectedAccount.id });

  return Boolean(deleted);
}
