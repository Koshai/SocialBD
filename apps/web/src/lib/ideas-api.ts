import type { ContentIdeaWithMeta, IdeaStatus } from "@socialbd/db";

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
    ...json,
    createdAt: new Date(json.createdAt),
    updatedAt: new Date(json.updatedAt),
  };
}
