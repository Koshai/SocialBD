import { and, eq } from "drizzle-orm";

import { countConnectedAccounts } from "./connected-accounts";
import { db } from "./db";
import { connectedAccount } from "./schema/connected-account";

export class ChannelLimitError extends Error {
  readonly code = "channel_limit" as const;

  constructor(
    readonly current: number,
    readonly max: number,
  ) {
    super(
      `Channel limit reached (${current}/${max}). Upgrade your plan to connect more social accounts.`,
    );
    this.name = "ChannelLimitError";
  }
}

export function isChannelLimitError(error: unknown): error is ChannelLimitError {
  return error instanceof ChannelLimitError;
}

/** Placeholder plan label until BDT billing ships. */
export function getPlanDisplayName() {
  return process.env.PLAN_DISPLAY_NAME?.trim() || "Free";
}

export function getMaxConnectedAccounts() {
  const raw = process.env.MAX_CONNECTED_ACCOUNTS?.trim() ?? "5";
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
}

export type PlanUsageSnapshot = {
  planName: string;
  connectedCount: number;
  maxConnectedAccounts: number;
  atLimit: boolean;
};

export async function getPlanUsageSnapshot(organizationId: string): Promise<PlanUsageSnapshot> {
  const maxConnectedAccounts = getMaxConnectedAccounts();
  const connectedCount = await countConnectedAccounts(organizationId);

  return {
    planName: getPlanDisplayName(),
    connectedCount,
    maxConnectedAccounts,
    atLimit: connectedCount >= maxConnectedAccounts,
  };
}

async function listConnectedProviderKeys(organizationId: string) {
  const rows = await db
    .select({
      platform: connectedAccount.platform,
      providerAccountId: connectedAccount.providerAccountId,
    })
    .from(connectedAccount)
    .where(
      and(eq(connectedAccount.organizationId, organizationId), eq(connectedAccount.status, "active")),
    );

  return new Set(rows.map((row) => `${row.platform}:${row.providerAccountId}`));
}

export async function countNewMetaConnections(
  organizationId: string,
  pages: Array<{ id: string; instagram_business_account?: { id: string } | null }>,
) {
  const existing = await listConnectedProviderKeys(organizationId);
  let newCount = 0;

  for (const page of pages) {
    if (!existing.has(`facebook_page:${page.id}`)) {
      newCount += 1;
    }
    const igId = page.instagram_business_account?.id;
    if (igId && !existing.has(`instagram:${igId}`)) {
      newCount += 1;
    }
  }

  return newCount;
}

export async function countNewLinkedInConnections(
  organizationId: string,
  linkedInOrganizationIds: string[],
) {
  const existing = await listConnectedProviderKeys(organizationId);
  let newCount = 0;

  for (const orgId of linkedInOrganizationIds) {
    if (!existing.has(`linkedin_organization:${orgId}`)) {
      newCount += 1;
    }
  }

  return newCount;
}

export async function assertChannelCapacity(organizationId: string, additionalNewAccounts: number) {
  if (additionalNewAccounts <= 0) return;

  const max = getMaxConnectedAccounts();
  const current = await countConnectedAccounts(organizationId);

  if (current + additionalNewAccounts > max) {
    throw new ChannelLimitError(current, max);
  }
}
