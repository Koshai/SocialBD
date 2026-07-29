import { getWorkspaceGalleryImage } from "@socialbd/db";

import { normalizeGalleryImageId } from "@/lib/idea-gallery";

export async function parseIdeaGalleryPayload(
  organizationId: string,
  json: object,
): Promise<{ galleryImageId: string | null; workspaceGalleryId: string | null }> {
  const galleryImageIdRaw =
    "galleryImageId" in json && json.galleryImageId
      ? String(json.galleryImageId)
      : null;
  const workspaceGalleryIdRaw =
    "workspaceGalleryId" in json && json.workspaceGalleryId
      ? String(json.workspaceGalleryId)
      : null;

  const galleryImageId = galleryImageIdRaw
    ? normalizeGalleryImageId(galleryImageIdRaw)
    : null;
  const workspaceGalleryId = workspaceGalleryIdRaw?.trim() || null;

  if (galleryImageId && workspaceGalleryId) {
    throw new Error("Choose either a starter or workspace image, not both.");
  }

  if (workspaceGalleryId) {
    const image = await getWorkspaceGalleryImage(workspaceGalleryId, organizationId);
    if (!image) {
      throw new Error("Workspace gallery image not found.");
    }
  }

  return { galleryImageId, workspaceGalleryId };
}
