import { eq } from "drizzle-orm";

import { db } from "./db";
import { invitation, organization } from "./schema/organization";

export type InvitationPreview = {
  id: string;
  email: string;
  status: string;
  organizationId: string;
  organizationName: string;
};

export async function getInvitationPreview(invitationId: string) {
  const [row] = await db
    .select({
      id: invitation.id,
      email: invitation.email,
      status: invitation.status,
      organizationId: invitation.organizationId,
      organizationName: organization.name,
    })
    .from(invitation)
    .innerJoin(organization, eq(invitation.organizationId, organization.id))
    .where(eq(invitation.id, invitationId))
    .limit(1);

  return row ?? null;
}
