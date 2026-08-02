import {
  getConnectedAccountForOrganization,
  getPostDetail,
  reschedulePost,
  updateEditablePost,
  assertMediaBelongsToOrganization,
} from "@socialbd/db";
import { NextResponse } from "next/server";

import { requireActiveOrganization } from "@/lib/dashboard-session";
import { isLinkedInFeatureEnabled, isLinkedInPlatform } from "@/lib/features/linkedin";
import { enqueuePublishPost } from "@/lib/publish-queue";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function mediaPreviewUrl(mediaPath: string | null) {
  if (!mediaPath) return null;
  return `/api/media/${encodeURIComponent(mediaPath)}`;
}

export async function GET(_request: Request, context: RouteContext) {
  const { organizationId } = await requireActiveOrganization();
  const { id } = await context.params;

  const detail = await getPostDetail(id, organizationId);
  if (!detail) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  return NextResponse.json({
    post: {
      ...detail,
      scheduledAt: detail.scheduledAt?.toISOString() ?? null,
      publishedAt: detail.publishedAt?.toISOString() ?? null,
      createdAt: detail.createdAt.toISOString(),
      previewUrl: mediaPreviewUrl(detail.mediaPath),
      hasMedia: Boolean(detail.mediaPath),
    },
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { organizationId } = await requireActiveOrganization();
  const { id } = await context.params;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof json !== "object" || json === null) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const body = json as Record<string, unknown>;
  const isFullEdit = "body" in body || "connectedAccountId" in body || "mediaPath" in body;

  if (!isFullEdit) {
    const scheduledAtRaw = body.scheduledAt;
    if (!scheduledAtRaw) {
      return NextResponse.json({ error: "scheduledAt is required." }, { status: 400 });
    }

    const scheduledAt = new Date(String(scheduledAtRaw));
    if (Number.isNaN(scheduledAt.getTime())) {
      return NextResponse.json({ error: "Invalid schedule time." }, { status: 400 });
    }

    try {
      const updated = await reschedulePost({
        postId: id,
        organizationId,
        scheduledAt,
      });

      await enqueuePublishPost(id, scheduledAt);

      return NextResponse.json({ post: updated });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not reschedule post.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  const caption = typeof body.body === "string" ? body.body : "";
  const connectedAccountId =
    typeof body.connectedAccountId === "string" ? body.connectedAccountId.trim() : "";
  const mediaPath =
    typeof body.mediaPath === "string" ? body.mediaPath.trim() || null : null;
  const mediaMimeType =
    typeof body.mediaMimeType === "string" ? body.mediaMimeType.trim() || null : null;
  const scheduledAtRaw = body.scheduledAt;
  const scheduledAt =
    scheduledAtRaw === null || scheduledAtRaw === undefined || scheduledAtRaw === ""
      ? null
      : new Date(String(scheduledAtRaw));

  if (scheduledAt && Number.isNaN(scheduledAt.getTime())) {
    return NextResponse.json({ error: "Invalid schedule time." }, { status: 400 });
  }

  if (!connectedAccountId) {
    return NextResponse.json({ error: "Select a channel." }, { status: 400 });
  }

  const account = await getConnectedAccountForOrganization(connectedAccountId, organizationId);
  if (!account) {
    return NextResponse.json({ error: "Channel not found." }, { status: 404 });
  }

  if (!isLinkedInFeatureEnabled() && isLinkedInPlatform(account.platform)) {
    return NextResponse.json({ error: "LinkedIn is not enabled." }, { status: 400 });
  }

  if (mediaPath) {
    try {
      assertMediaBelongsToOrganization(mediaPath, organizationId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid media.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  try {
    const updated = await updateEditablePost({
      postId: id,
      organizationId,
      connectedAccountId,
      body: caption,
      mediaPath,
      mediaMimeType,
      scheduledAt,
    });

    if (updated.status === "scheduled" && updated.scheduledAt) {
      await enqueuePublishPost(updated.id, updated.scheduledAt);
    }

    return NextResponse.json({ post: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update post.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
