import { and, eq } from "drizzle-orm";

import { db } from "./db";
import { member } from "./schema/organization";

export async function userBelongsToOrganization(userId: string, organizationId: string) {
  const [row] = await db
    .select({ id: member.id })
    .from(member)
    .where(and(eq(member.organizationId, organizationId), eq(member.userId, userId)))
    .limit(1);

  return Boolean(row);
}
