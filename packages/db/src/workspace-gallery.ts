import { and, desc, eq, ilike } from "drizzle-orm";

import { db } from "./db";
import { workspaceGalleryImage } from "./schema/workspace-gallery-image";

export type WorkspaceGalleryImageRow = {
  id: string;
  organizationId: string;
  uploadedByUserId: string;
  name: string;
  category: string;
  mediaPath: string;
  mediaMimeType: string;
  createdAt: Date;
};

export async function listWorkspaceGalleryImages(input: {
  organizationId: string;
  category?: string | "all";
  search?: string;
}) {
  const conditions = [eq(workspaceGalleryImage.organizationId, input.organizationId)];

  if (input.category && input.category !== "all") {
    conditions.push(eq(workspaceGalleryImage.category, input.category));
  }

  const search = input.search?.trim();
  if (search) {
    conditions.push(ilike(workspaceGalleryImage.name, `%${search}%`));
  }

  const rows = await db
    .select()
    .from(workspaceGalleryImage)
    .where(and(...conditions))
    .orderBy(desc(workspaceGalleryImage.createdAt));

  return rows as WorkspaceGalleryImageRow[];
}

export async function getWorkspaceGalleryImage(id: string, organizationId: string) {
  const [row] = await db
    .select()
    .from(workspaceGalleryImage)
    .where(
      and(
        eq(workspaceGalleryImage.id, id),
        eq(workspaceGalleryImage.organizationId, organizationId),
      ),
    )
    .limit(1);

  return (row as WorkspaceGalleryImageRow | undefined) ?? null;
}

export async function createWorkspaceGalleryImage(input: {
  organizationId: string;
  uploadedByUserId: string;
  name: string;
  category: string;
  mediaPath: string;
  mediaMimeType: string;
}) {
  const name = input.name.trim() || "Untitled image";
  const now = new Date();
  const id = crypto.randomUUID();

  const [row] = await db
    .insert(workspaceGalleryImage)
    .values({
      id,
      organizationId: input.organizationId,
      uploadedByUserId: input.uploadedByUserId,
      name,
      category: input.category,
      mediaPath: input.mediaPath,
      mediaMimeType: input.mediaMimeType,
      createdAt: now,
    })
    .returning();

  return row as WorkspaceGalleryImageRow;
}

export async function deleteWorkspaceGalleryImage(id: string, organizationId: string) {
  const [deleted] = await db
    .delete(workspaceGalleryImage)
    .where(
      and(
        eq(workspaceGalleryImage.id, id),
        eq(workspaceGalleryImage.organizationId, organizationId),
      ),
    )
    .returning({ id: workspaceGalleryImage.id });

  return Boolean(deleted);
}
