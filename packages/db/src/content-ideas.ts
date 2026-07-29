import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "./db";
import { campaign } from "./schema/campaign";
import { contentIdea } from "./schema/content-idea";
import { contentIdeaTag } from "./schema/content-idea-tag";
import { contentTag } from "./schema/content-tag";
import { user } from "./schema/auth";
<<<<<<< HEAD
=======
import { workspaceGalleryImage } from "./schema/workspace-gallery-image";
>>>>>>> 4d6e2ef9950540f1b3bcc52875ef8b65928e1ff8

import { findOrCreateContentTags } from "./content-tags";
import type { OrganizationRole } from "./members";

export type IdeaStatus = "brainstorm" | "ready" | "archived";

export type ContentIdeaWithMeta = {
  id: string;
  title: string;
  body: string;
  status: IdeaStatus;
  campaignId: string | null;
  campaignName: string | null;
  createdByUserId: string;
  authorName: string;
  promotedPostId: string | null;
<<<<<<< HEAD
=======
  galleryImageId: string | null;
  workspaceGalleryId: string | null;
  workspaceGalleryMediaPath: string | null;
  workspaceGalleryMediaMimeType: string | null;
>>>>>>> 4d6e2ef9950540f1b3bcc52875ef8b65928e1ff8
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
};

export function canEditContentIdea(
  role: OrganizationRole | null,
  idea: { createdByUserId: string },
  userId: string,
) {
  if (!role) return false;
  if (role === "owner" || role === "admin") return true;
  return idea.createdByUserId === userId;
}

async function loadTagsForIdeas(ideaIds: string[]) {
  if (ideaIds.length === 0) return new Map<string, string[]>();

  const rows = await db
    .select({
      ideaId: contentIdeaTag.ideaId,
      tagName: contentTag.name,
    })
    .from(contentIdeaTag)
    .innerJoin(contentTag, eq(contentIdeaTag.tagId, contentTag.id))
    .where(inArray(contentIdeaTag.ideaId, ideaIds));

  const map = new Map<string, string[]>();
  for (const row of rows) {
    const list = map.get(row.ideaId) ?? [];
    list.push(row.tagName);
    map.set(row.ideaId, list);
  }
  return map;
}

<<<<<<< HEAD
=======
const ideaSelect = {
  id: contentIdea.id,
  title: contentIdea.title,
  body: contentIdea.body,
  status: contentIdea.status,
  campaignId: contentIdea.campaignId,
  campaignName: campaign.name,
  createdByUserId: contentIdea.createdByUserId,
  authorName: user.name,
  promotedPostId: contentIdea.promotedPostId,
  galleryImageId: contentIdea.galleryImageId,
  workspaceGalleryId: contentIdea.workspaceGalleryId,
  workspaceGalleryMediaPath: workspaceGalleryImage.mediaPath,
  workspaceGalleryMediaMimeType: workspaceGalleryImage.mediaMimeType,
  createdAt: contentIdea.createdAt,
  updatedAt: contentIdea.updatedAt,
};

function applyIdeaGalleryFields(input: {
  galleryImageId?: string | null;
  workspaceGalleryId?: string | null;
}) {
  const hasStarter = input.galleryImageId !== undefined;
  const hasWorkspace = input.workspaceGalleryId !== undefined;
  if (!hasStarter && !hasWorkspace) return null;

  const galleryImageId = hasStarter ? (input.galleryImageId ?? null) : null;
  const workspaceGalleryId = hasWorkspace ? (input.workspaceGalleryId ?? null) : null;

  if (galleryImageId && workspaceGalleryId) {
    throw new Error("Choose either a starter or workspace image, not both.");
  }

  if (hasStarter && hasWorkspace) {
    return { galleryImageId, workspaceGalleryId };
  }
  if (hasStarter) {
    return { galleryImageId, workspaceGalleryId: null };
  }
  return { galleryImageId: null, workspaceGalleryId };
}

>>>>>>> 4d6e2ef9950540f1b3bcc52875ef8b65928e1ff8
export async function listContentIdeas(input: {
  organizationId: string;
  status?: IdeaStatus | "all";
  campaignId?: string | "all";
  tagId?: string | "all";
}) {
  const conditions = [eq(contentIdea.organizationId, input.organizationId)];

  if (input.status && input.status !== "all") {
    conditions.push(eq(contentIdea.status, input.status));
  }
  if (input.campaignId && input.campaignId !== "all") {
    conditions.push(eq(contentIdea.campaignId, input.campaignId));
  }

  let ideaIdsForTag: string[] | null = null;
  if (input.tagId && input.tagId !== "all") {
    const tagged = await db
      .select({ ideaId: contentIdeaTag.ideaId })
      .from(contentIdeaTag)
      .where(eq(contentIdeaTag.tagId, input.tagId));
    ideaIdsForTag = tagged.map((row) => row.ideaId);
    if (ideaIdsForTag.length === 0) {
      return [];
    }
    conditions.push(inArray(contentIdea.id, ideaIdsForTag));
  }

  const rows = await db
<<<<<<< HEAD
    .select({
      id: contentIdea.id,
      title: contentIdea.title,
      body: contentIdea.body,
      status: contentIdea.status,
      campaignId: contentIdea.campaignId,
      campaignName: campaign.name,
      createdByUserId: contentIdea.createdByUserId,
      authorName: user.name,
      promotedPostId: contentIdea.promotedPostId,
      createdAt: contentIdea.createdAt,
      updatedAt: contentIdea.updatedAt,
    })
    .from(contentIdea)
    .innerJoin(user, eq(contentIdea.createdByUserId, user.id))
    .leftJoin(campaign, eq(contentIdea.campaignId, campaign.id))
=======
    .select(ideaSelect)
    .from(contentIdea)
    .innerJoin(user, eq(contentIdea.createdByUserId, user.id))
    .leftJoin(campaign, eq(contentIdea.campaignId, campaign.id))
    .leftJoin(workspaceGalleryImage, eq(contentIdea.workspaceGalleryId, workspaceGalleryImage.id))
>>>>>>> 4d6e2ef9950540f1b3bcc52875ef8b65928e1ff8
    .where(and(...conditions))
    .orderBy(desc(contentIdea.updatedAt));

  const tagMap = await loadTagsForIdeas(rows.map((row) => row.id));

  return rows.map((row) => ({
    ...row,
    status: row.status as IdeaStatus,
    tags: tagMap.get(row.id) ?? [],
  })) as ContentIdeaWithMeta[];
}

export async function getContentIdea(ideaId: string, organizationId: string) {
  const [row] = await db
<<<<<<< HEAD
    .select({
      id: contentIdea.id,
      title: contentIdea.title,
      body: contentIdea.body,
      status: contentIdea.status,
      campaignId: contentIdea.campaignId,
      campaignName: campaign.name,
      createdByUserId: contentIdea.createdByUserId,
      authorName: user.name,
      promotedPostId: contentIdea.promotedPostId,
      createdAt: contentIdea.createdAt,
      updatedAt: contentIdea.updatedAt,
    })
    .from(contentIdea)
    .innerJoin(user, eq(contentIdea.createdByUserId, user.id))
    .leftJoin(campaign, eq(contentIdea.campaignId, campaign.id))
=======
    .select(ideaSelect)
    .from(contentIdea)
    .innerJoin(user, eq(contentIdea.createdByUserId, user.id))
    .leftJoin(campaign, eq(contentIdea.campaignId, campaign.id))
    .leftJoin(workspaceGalleryImage, eq(contentIdea.workspaceGalleryId, workspaceGalleryImage.id))
>>>>>>> 4d6e2ef9950540f1b3bcc52875ef8b65928e1ff8
    .where(and(eq(contentIdea.id, ideaId), eq(contentIdea.organizationId, organizationId)))
    .limit(1);

  if (!row) return null;

  const tagMap = await loadTagsForIdeas([row.id]);

  return {
    ...row,
    status: row.status as IdeaStatus,
    tags: tagMap.get(row.id) ?? [],
  } as ContentIdeaWithMeta;
}

async function syncIdeaTags(ideaId: string, organizationId: string, tagNames: string[]) {
  await db.delete(contentIdeaTag).where(eq(contentIdeaTag.ideaId, ideaId));

  const tags = await findOrCreateContentTags(organizationId, tagNames);
  if (tags.length === 0) return;

  await db.insert(contentIdeaTag).values(
    tags.map((tag) => ({
      ideaId,
      tagId: tag.id,
    })),
  );
}

export async function createContentIdea(input: {
  organizationId: string;
  createdByUserId: string;
  title: string;
  body: string;
  status?: IdeaStatus;
  campaignId?: string | null;
  tagNames?: string[];
<<<<<<< HEAD
=======
  galleryImageId?: string | null;
  workspaceGalleryId?: string | null;
>>>>>>> 4d6e2ef9950540f1b3bcc52875ef8b65928e1ff8
}) {
  const title = input.title.trim() || "Untitled idea";
  const body = input.body.trim();
  const now = new Date();
  const id = crypto.randomUUID();
<<<<<<< HEAD
=======
  const galleryFields = applyIdeaGalleryFields(input) ?? {
    galleryImageId: null,
    workspaceGalleryId: null,
  };
>>>>>>> 4d6e2ef9950540f1b3bcc52875ef8b65928e1ff8

  await db.insert(contentIdea).values({
    id,
    organizationId: input.organizationId,
    campaignId: input.campaignId ?? null,
    createdByUserId: input.createdByUserId,
    title,
    body,
    status: input.status ?? "brainstorm",
    promotedPostId: null,
<<<<<<< HEAD
=======
    galleryImageId: galleryFields.galleryImageId,
    workspaceGalleryId: galleryFields.workspaceGalleryId,
>>>>>>> 4d6e2ef9950540f1b3bcc52875ef8b65928e1ff8
    createdAt: now,
    updatedAt: now,
  });

  if (input.tagNames?.length) {
    await syncIdeaTags(id, input.organizationId, input.tagNames);
  }

  const idea = await getContentIdea(id, input.organizationId);
  if (!idea) {
    throw new Error("Could not create idea.");
  }
  return idea;
}

export async function updateContentIdea(input: {
  ideaId: string;
  organizationId: string;
  title?: string;
  body?: string;
  status?: IdeaStatus;
  campaignId?: string | null;
  tagNames?: string[];
<<<<<<< HEAD
=======
  galleryImageId?: string | null;
  workspaceGalleryId?: string | null;
>>>>>>> 4d6e2ef9950540f1b3bcc52875ef8b65928e1ff8
}) {
  const now = new Date();
  const patch: Partial<typeof contentIdea.$inferInsert> = { updatedAt: now };

  if (input.title !== undefined) patch.title = input.title.trim() || "Untitled idea";
  if (input.body !== undefined) patch.body = input.body.trim();
  if (input.status !== undefined) patch.status = input.status;
  if (input.campaignId !== undefined) patch.campaignId = input.campaignId;

<<<<<<< HEAD
=======
  const galleryFields = applyIdeaGalleryFields(input);
  if (galleryFields) {
    patch.galleryImageId = galleryFields.galleryImageId;
    patch.workspaceGalleryId = galleryFields.workspaceGalleryId;
  }

>>>>>>> 4d6e2ef9950540f1b3bcc52875ef8b65928e1ff8
  const [updated] = await db
    .update(contentIdea)
    .set(patch)
    .where(and(eq(contentIdea.id, input.ideaId), eq(contentIdea.organizationId, input.organizationId)))
    .returning({ id: contentIdea.id });

  if (!updated) {
    throw new Error("Idea not found.");
  }

  if (input.tagNames !== undefined) {
    await syncIdeaTags(input.ideaId, input.organizationId, input.tagNames);
  }

  return getContentIdea(input.ideaId, input.organizationId);
}

export async function deleteContentIdea(ideaId: string, organizationId: string) {
  const [deleted] = await db
    .delete(contentIdea)
    .where(and(eq(contentIdea.id, ideaId), eq(contentIdea.organizationId, organizationId)))
    .returning({ id: contentIdea.id });

  return Boolean(deleted);
}

export async function markContentIdeaPromoted(input: {
  ideaId: string;
  organizationId: string;
  postId: string;
}) {
  const now = new Date();
  const [updated] = await db
    .update(contentIdea)
    .set({
      promotedPostId: input.postId,
      status: "ready",
      updatedAt: now,
    })
    .where(and(eq(contentIdea.id, input.ideaId), eq(contentIdea.organizationId, input.organizationId)))
    .returning({ id: contentIdea.id });

  return Boolean(updated);
}

export async function countIdeasByStatus(organizationId: string) {
  const rows = await db
    .select({
      status: contentIdea.status,
      count: sql<number>`count(*)::int`,
    })
    .from(contentIdea)
    .where(eq(contentIdea.organizationId, organizationId))
    .groupBy(contentIdea.status);

  const counts: Record<IdeaStatus | "all", number> = {
    all: 0,
    brainstorm: 0,
    ready: 0,
    archived: 0,
  };
  for (const row of rows) {
    const status = row.status as IdeaStatus;
    if (status === "brainstorm" || status === "ready" || status === "archived") {
      counts[status] = row.count;
    }
    counts.all += row.count;
  }
  return counts;
}
