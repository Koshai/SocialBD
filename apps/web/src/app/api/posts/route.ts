import {
  assertMediaBelongsToOrganization,
  countPendingApprovalPosts,
  countScheduledPosts,
  createPost,
  getConnectedAccountForOrganization,
  listPostsForOrganization,
} from "@socialbd/db";
import { NextResponse } from "next/server";

import { requireActiveOrganization } from "@/lib/dashboard-session";
import { canPublishDirectly, getMemberRoleForUser } from "@/lib/organization-roles";
import { enqueuePublishPost } from "@/lib/publish-queue";
import { serializePostSnapshot } from "@/lib/posts-api";

export async function GET() {
  const { organizationId } = await requireActiveOrganization();
  const [posts, scheduledCount, pendingApprovalCount] = await Promise.all([
    listPostsForOrganization(organizationId),
    countScheduledPosts(organizationId),
    countPendingApprovalPosts(organizationId),
  ]);

  return NextResponse.json(
    serializePostSnapshot({ posts, scheduledCount, pendingApprovalCount }),
  );
}

export async function POST(request: Request) {
  const { organizationId, userId } = await requireActiveOrganization();

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const body =
    typeof json === "object" && json !== null && "body" in json
      ? String((json as { body: unknown }).body)
      : "";
  const connectedAccountId =
    typeof json === "object" && json !== null && "connectedAccountId" in json
      ? String((json as { connectedAccountId: unknown }).connectedAccountId)
      : "";
  const scheduledAtRaw =
    typeof json === "object" && json !== null && "scheduledAt" in json
      ? (json as { scheduledAt: unknown }).scheduledAt
      : null;
  const publishNow =
    typeof json === "object" && json !== null && (json as { publishNow?: boolean }).publishNow === true;
  const mediaPath =
    typeof json === "object" && json !== null && "mediaPath" in json
      ? String((json as { mediaPath: unknown }).mediaPath).trim() || null
      : null;
  const mediaMimeType =
    typeof json === "object" && json !== null && "mediaMimeType" in json
      ? String((json as { mediaMimeType: unknown }).mediaMimeType).trim() || null
      : null;
  const submitForApproval =
    typeof json === "object" &&
    json !== null &&
    (json as { submitForApproval?: boolean }).submitForApproval === true;

  const role = await getMemberRoleForUser(userId, organizationId);
  const canPublish = canPublishDirectly(role);

  if (!connectedAccountId) {
    return NextResponse.json({ error: "Select a channel." }, { status: 400 });
  }

  const account = await getConnectedAccountForOrganization(connectedAccountId, organizationId);
  if (!account) {
    return NextResponse.json({ error: "Channel not found." }, { status: 404 });
  }

  if (account.platform === "instagram" && !mediaPath) {
    return NextResponse.json({ error: "Instagram posts require an image." }, { status: 400 });
  }

  let scheduledAt: Date | null = null;
  if (scheduledAtRaw) {
    scheduledAt = new Date(String(scheduledAtRaw));
    if (Number.isNaN(scheduledAt.getTime())) {
      return NextResponse.json({ error: "Invalid schedule time." }, { status: 400 });
    }
  }

  if (publishNow && scheduledAt && scheduledAt.getTime() > Date.now()) {
    return NextResponse.json(
      { error: "Publish now cannot be combined with a future schedule time." },
      { status: 400 },
    );
  }

  const wantsApprovalFlow = Boolean(
    submitForApproval || (!canPublish && (publishNow || scheduledAt)),
  );
  const wantsDraftOnly = !canPublish && !publishNow && !scheduledAt && !submitForApproval;

  if (!canPublish && publishNow && !submitForApproval) {
    return NextResponse.json(
      { error: "Members must submit posts for approval. Use Submit for approval." },
      { status: 403 },
    );
  }

  if (mediaPath) {
    try {
      assertMediaBelongsToOrganization(mediaPath, organizationId);
    } catch {
      return NextResponse.json({ error: "Invalid image. Upload again." }, { status: 400 });
    }
    if (!mediaMimeType) {
      return NextResponse.json({ error: "Image type is missing. Upload again." }, { status: 400 });
    }
  }

  try {
    const created = await createPost({
      organizationId,
      connectedAccountId,
      createdByUserId: userId,
      body,
      mediaPath,
      mediaMimeType,
      scheduledAt: publishNow ? null : scheduledAt,
      submitForApproval: wantsApprovalFlow && !wantsDraftOnly,
    });

    if (!created) {
      return NextResponse.json({ error: "Could not save post." }, { status: 500 });
    }

    if (canPublish && publishNow) {
      await enqueuePublishPost(created.id);
    } else if (canPublish && created.status === "scheduled" && created.scheduledAt) {
      await enqueuePublishPost(created.id, created.scheduledAt);
    }

    return NextResponse.json({
      post: created,
      publishing:
        canPublish && (publishNow || (created.status === "scheduled" && Boolean(created.scheduledAt))),
      submittedForApproval: created.status === "pending_approval",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save post.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
