<<<<<<< HEAD
import { upsertLinkedInOrganizationAccount } from "@socialbd/db";
=======
import {
  assertChannelCapacity,
  countNewLinkedInConnections,
  upsertLinkedInOrganizationAccount,
} from "@socialbd/db";
>>>>>>> 4d6e2ef9950540f1b3bcc52875ef8b65928e1ff8

import {
  fetchAdministeredOrganizations,
  fetchOrganizationDetails,
  organizationLogoUrl,
  parseOrganizationUrn,
} from "./client";
import { getLinkedInScopeString } from "./scopes";

export async function syncLinkedInOrganizationsForOrganization(input: {
  organizationId: string;
  accessToken: string;
  expiresInSeconds?: number;
}) {
  const tokenExpiresAt =
    input.expiresInSeconds != null
      ? new Date(Date.now() + input.expiresInSeconds * 1000)
      : null;

  const orgUrns = await fetchAdministeredOrganizations(input.accessToken);
<<<<<<< HEAD
=======
  const orgIds = orgUrns
    .map((urn) => parseOrganizationUrn(urn))
    .filter((id): id is string => Boolean(id));

  await assertChannelCapacity(
    input.organizationId,
    await countNewLinkedInConnections(input.organizationId, orgIds),
  );

>>>>>>> 4d6e2ef9950540f1b3bcc52875ef8b65928e1ff8
  const scopes = getLinkedInScopeString();
  let synced = 0;

  for (const urn of orgUrns) {
    const orgId = parseOrganizationUrn(urn);
    if (!orgId) continue;

    let displayName = `Organization ${orgId}`;
    let vanityName: string | null = null;
    let pictureUrl: string | null = null;

    try {
      const details = await fetchOrganizationDetails(orgId, input.accessToken);
      displayName = details.localizedName ?? displayName;
      vanityName = details.vanityName ?? null;
      pictureUrl = organizationLogoUrl(details);
    } catch (cause) {
      console.warn(`[linkedin] Could not load org ${orgId}:`, cause);
    }

    await upsertLinkedInOrganizationAccount({
      organizationId: input.organizationId,
      linkedInOrganizationId: orgId,
      displayName,
      vanityName,
      pictureUrl,
      accessToken: input.accessToken,
      tokenExpiresAt,
      scopes,
    });
    synced += 1;
  }

  return { organizationCount: synced };
}
