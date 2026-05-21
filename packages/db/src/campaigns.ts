import { asc, eq } from "drizzle-orm";

import { db } from "./db";
import { campaign } from "./schema/campaign";

export type CampaignRow = {
  id: string;
  name: string;
  createdAt: Date;
};

export async function listCampaigns(organizationId: string) {
  const rows = await db
    .select({
      id: campaign.id,
      name: campaign.name,
      createdAt: campaign.createdAt,
    })
    .from(campaign)
    .where(eq(campaign.organizationId, organizationId))
    .orderBy(asc(campaign.name));

  return rows as CampaignRow[];
}

export async function createCampaign(input: { organizationId: string; name: string }) {
  const trimmed = input.name.trim();
  if (!trimmed) {
    throw new Error("Campaign name is required.");
  }

  const now = new Date();
  const id = crypto.randomUUID();

  try {
    const [row] = await db
      .insert(campaign)
      .values({
        id,
        organizationId: input.organizationId,
        name: trimmed,
        createdAt: now,
        updatedAt: now,
      })
      .returning({
        id: campaign.id,
        name: campaign.name,
        createdAt: campaign.createdAt,
      });

    return row as CampaignRow;
  } catch {
    throw new Error("A campaign with that name already exists.");
  }
}
