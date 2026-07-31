import {
  canEditContentIdea,
  deleteContentIdea,
  getContentIdea,
  updateContentIdea,
  type IdeaStatus,
} from "@socialbd/db";
import { NextResponse } from "next/server";

import { requireActiveOrganization } from "@/lib/dashboard-session";
import { getMemberRoleForUser } from "@/lib/organization-roles";
import { serializeIdea } from "@/lib/ideas-api";
import { parseIdeaGalleryPayload } from "@/lib/idea-gallery-payload";

const VALID_STATUSES = new Set(["brainstorm", "ready", "archived"]);

type RouteContext = { params: Promise<{ ideaId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { organizationId } = await requireActiveOrganization();
  const { ideaId } = await context.params;
  const idea = await getContentIdea(ideaId, organizationId);

  if (!idea) {
    return NextResponse.json({ error: "Idea not found." }, { status: 404 });
  }

  return NextResponse.json({ idea: serializeIdea(idea) });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { organizationId, userId } = await requireActiveOrganization();
  const { ideaId } = await context.params;

  const existing = await getContentIdea(ideaId, organizationId);
  if (!existing) {
    return NextResponse.json({ error: "Idea not found." }, { status: 404 });
  }

  const role = await getMemberRoleForUser(userId, organizationId);
  if (!canEditContentIdea(role, existing, userId)) {
    return NextResponse.json({ error: "You cannot edit this idea." }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof json !== "object" || json === null) {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const patch: Parameters<typeof updateContentIdea>[0] = {
    ideaId,
    organizationId,
  };

  if ("title" in json) patch.title = String(json.title);
  if ("body" in json) patch.body = String(json.body);
  if ("campaignId" in json) {
    patch.campaignId = json.campaignId ? String(json.campaignId) : null;
  }
  if ("status" in json) {
    const status = String(json.status);
    if (!VALID_STATUSES.has(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    patch.status = status as IdeaStatus;
  }
  if ("tagNames" in json && Array.isArray(json.tagNames)) {
    patch.tagNames = json.tagNames.map(String);
  }
  if ("galleryImageId" in json || "workspaceGalleryId" in json) {
    try {
      const galleryFields = await parseIdeaGalleryPayload(organizationId, json);
      patch.galleryImageId = galleryFields.galleryImageId;
      patch.workspaceGalleryId = galleryFields.workspaceGalleryId;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid gallery image.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  try {
    const idea = await updateContentIdea(patch);
    return NextResponse.json({ idea: idea ? serializeIdea(idea) : null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update idea.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { organizationId, userId } = await requireActiveOrganization();
  const { ideaId } = await context.params;

  const existing = await getContentIdea(ideaId, organizationId);
  if (!existing) {
    return NextResponse.json({ error: "Idea not found." }, { status: 404 });
  }

  const role = await getMemberRoleForUser(userId, organizationId);
  if (!canEditContentIdea(role, existing, userId)) {
    return NextResponse.json({ error: "You cannot delete this idea." }, { status: 403 });
  }

  await deleteContentIdea(ideaId, organizationId);
  return NextResponse.json({ ok: true });
}
