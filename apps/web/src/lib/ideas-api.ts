import type { ContentIdeaWithMeta, IdeaStatus } from "@socialbd/db";

import {
  getIdeaGalleryPreviewUrl,
  getIdeaPromoteMedia,
} from "@/lib/idea-gallery-selection";

export type IdeaPromoteMediaJson = {
  mediaPath: string;
  mediaMimeType: string;
  previewUrl: string;
};

export type IdeaJson = {
  id: string;
  title: string;
  body: string;
  status: IdeaStatus;
  campaignId: string | null;
  campaignName: string | null;
  createdByUserId: string;
  authorName: string;
  promotedPostId: string | null;
  galleryImageId: string | null;
  workspaceGalleryId: string | null;
  galleryPreviewUrl: string | null;
  promoteMedia: IdeaPromoteMediaJson | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export function serializeIdea(idea: ContentIdeaWithMeta): IdeaJson {
  return {
    id: idea.id,
    title: idea.title,
    body: idea.body,
    status: idea.status,
    campaignId: idea.campaignId,
    campaignName: idea.campaignName,
    createdByUserId: idea.createdByUserId,
    authorName: idea.authorName,
    promotedPostId: idea.promotedPostId,
    galleryImageId: idea.galleryImageId,
    workspaceGalleryId: idea.workspaceGalleryId,
    galleryPreviewUrl: getIdeaGalleryPreviewUrl(idea),
    promoteMedia: getIdeaPromoteMedia(idea),
    tags: idea.tags,
    createdAt: idea.createdAt.toISOString(),
    updatedAt: idea.updatedAt.toISOString(),
  };
}

export function serializeIdeaCounts(counts: Record<string, number>) {
  return {
    all: counts.all ?? 0,
    brainstorm: counts.brainstorm ?? 0,
    ready: counts.ready ?? 0,
    archived: counts.archived ?? 0,
  };
}

export function parseIdea(json: IdeaJson): ContentIdeaWithMeta {
  return {
    id: json.id,
    title: json.title,
    body: json.body,
    status: json.status,
    campaignId: json.campaignId,
    campaignName: json.campaignName,
    createdByUserId: json.createdByUserId,
    authorName: json.authorName,
    promotedPostId: json.promotedPostId,
    galleryImageId: json.galleryImageId,
    workspaceGalleryId: json.workspaceGalleryId,
    workspaceGalleryMediaPath: json.promoteMedia?.mediaPath ?? null,
    workspaceGalleryMediaMimeType: json.promoteMedia?.mediaMimeType ?? null,
    tags: json.tags,
    createdAt: new Date(json.createdAt),
    updatedAt: new Date(json.updatedAt),
  };
}
