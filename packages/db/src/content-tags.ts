import { and, asc, eq } from "drizzle-orm";

import { db } from "./db";
import { contentTag } from "./schema/content-tag";

export type ContentTagRow = {
  id: string;
  name: string;
};

function normalizeTagName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export async function listContentTags(organizationId: string) {
  const rows = await db
    .select({ id: contentTag.id, name: contentTag.name })
    .from(contentTag)
    .where(eq(contentTag.organizationId, organizationId))
    .orderBy(asc(contentTag.name));

  return rows as ContentTagRow[];
}

export async function findOrCreateContentTags(organizationId: string, tagNames: string[]) {
  const normalized = [
    ...new Set(tagNames.map(normalizeTagName).filter((name) => name.length > 0)),
  ];

  const result: ContentTagRow[] = [];

  for (const name of normalized) {
    const [existing] = await db
      .select({ id: contentTag.id, name: contentTag.name })
      .from(contentTag)
      .where(and(eq(contentTag.organizationId, organizationId), eq(contentTag.name, name)))
      .limit(1);

    if (existing) {
      result.push(existing);
      continue;
    }

    const now = new Date();
    const [created] = await db
      .insert(contentTag)
      .values({
        id: crypto.randomUUID(),
        organizationId,
        name,
        createdAt: now,
      })
      .returning({ id: contentTag.id, name: contentTag.name });

    if (created) result.push(created);
  }

  return result;
}
