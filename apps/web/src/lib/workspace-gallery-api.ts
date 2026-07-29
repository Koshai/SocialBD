import type { WorkspaceGalleryImageRow } from "@socialbd/db";

import { mediaPreviewUrl } from "@/lib/idea-gallery-selection";

export type WorkspaceGalleryImageJson = {
  id: string;
  name: string;
  category: string;
  previewUrl: string;
  mediaPath: string;
  mediaMimeType: string;
  uploadedByUserId: string;
  createdAt: string;
};

export function serializeWorkspaceGalleryImage(
  image: WorkspaceGalleryImageRow,
): WorkspaceGalleryImageJson {
  return {
    id: image.id,
    name: image.name,
    category: image.category,
    previewUrl: mediaPreviewUrl(image.mediaPath),
    mediaPath: image.mediaPath,
    mediaMimeType: image.mediaMimeType,
    uploadedByUserId: image.uploadedByUserId,
    createdAt: image.createdAt.toISOString(),
  };
}
