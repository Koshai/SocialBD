import type { ContentIdeaWithMeta } from "@socialbd/db";

import { getGalleryImageById } from "@/lib/idea-gallery";

export type IdeaGallerySelection = {
  starterId: string | null;
  workspaceId: string | null;
};

export const emptyGallerySelection = (): IdeaGallerySelection => ({
  starterId: null,
  workspaceId: null,
});

export function mediaPreviewUrl(mediaPath: string) {
  return `/api/media/${encodeURIComponent(mediaPath)}`;
}

export function getIdeaGalleryPreviewUrl(idea: {
  galleryImageId: string | null;
  workspaceGalleryMediaPath: string | null;
}): string | null {
  if (idea.workspaceGalleryMediaPath) {
    return mediaPreviewUrl(idea.workspaceGalleryMediaPath);
  }
  if (idea.galleryImageId) {
    return getGalleryImageById(idea.galleryImageId)?.src ?? null;
  }
  return null;
}

export function getIdeaPromoteMedia(idea: ContentIdeaWithMeta) {
  if (idea.workspaceGalleryMediaPath && idea.workspaceGalleryMediaMimeType) {
    return {
      mediaPath: idea.workspaceGalleryMediaPath,
      mediaMimeType: idea.workspaceGalleryMediaMimeType,
      previewUrl: mediaPreviewUrl(idea.workspaceGalleryMediaPath),
    };
  }
  return null;
}

export function selectionFromIdea(idea: {
  galleryImageId: string | null;
  workspaceGalleryId: string | null;
}): IdeaGallerySelection {
  return {
    starterId: idea.galleryImageId,
    workspaceId: idea.workspaceGalleryId,
  };
}

export function isGallerySelectionEmpty(selection: IdeaGallerySelection) {
  return !selection.starterId && !selection.workspaceId;
}

export function gallerySelectionLabel(
  selection: IdeaGallerySelection,
  t: (key: string) => string,
  workspaceName?: string | null,
) {
  if (selection.workspaceId && workspaceName) return workspaceName;
  if (selection.starterId) return t(`ideas.galleryImages.${selection.starterId}`);
  return "";
}
