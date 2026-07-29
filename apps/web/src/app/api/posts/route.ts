import {
  assertMediaBelongsToOrganization,
  countPendingApprovalPosts,
  countPostsByStatus,
  countScheduledPosts,
  createPost,
  getConnectedAccountForOrganization,
  markContentIdeaPromoted,
  listPostsFiltered,
  type PostStatus,
} from "@socialbd/db";
import { NextResponse } from "next/server";

import { requireActiveOrganization } from "@/lib/dashboard-session";
<<<<<<< HEAD
=======
import { notifyPostSubmittedForApproval } from "@/lib/approval-notifications";
import { isLinkedInFeatureEnabled, isLinkedInPlatform } from "@/lib/features/linkedin";
>>>>>>> 4d6e2ef9950540f1b3bcc52875ef8b65928e1ff8
import { canPublishDirectly, getMemberRoleForUser } from "@/lib/organization-roles";
import { enqueuePublishPost } from "@/lib/publish-queue";
import {
  parsePostHistoryFilter,
  serializePostSnapshot,
  type PostSnapshotJson,
} from "@/lib/posts-api";

const VALID_STATUSES = new Set([
  "all",
  "draft",
  "pending_approval",
  "scheduled",
  "published",
  "failed",
  "rejected",
]);

export async function GET(request: Request) {
  const { organizationId } = await requireActiveOrganization();
  const { searchParams } = new URL(request.url);

  const statusRaw = searchParams.get("status") ?? "all";
  const status = VALID_STATUSES.has(statusRaw) ? statusRaw : "all";
  const filter = parsePostHistoryFilter(searchParams);
  const limitRaw = Number(searchParams.get("limit") ?? "20");
  const limit = Number.isFinite(limitRaw) ? limitRaw : 20;
  const cursor = searchParams.get("cursor") ?? undefined;

  const [{ posts, nextCursor }, counts, scheduledCount, pendingApprovalCount] = await Promise.all([
    listPostsFiltered({
      organizationId,
      status: status === "all" ? "all" : (status as PostStatus),
      platform: filter.platform,
      limit,
      cursor,
    }),
    countPostsByStatus(organizationId),
    countScheduledPosts(organizationId),
    countPendingApprovalPosts(organizationId),
  ]);

  const body: PostSnapshotJson = {
    ...serializePostSnapshot({ posts, scheduledCount, pendingApprovalCount }),
    counts,
    nextCursor,
  };

  return NextResponse.json(body);
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
  const ideaId =
    typeof json === "object" && json !== null && "ideaId" in json
      ? String((json as { ideaId: unknown }).ideaId).trim() || null
      : null;

  const role = await getMemberRoleForUser(userId, organizationId);
  const canPublish = canPublishDirectly(role);

  if (!connectedAccountId) {
    return NextResponse.json({ error: "Select a channel." }, { status: 400 });
  }

  const account = await getConnectedAccountForOrganization(connectedAccountId, organizationId);
  if (!account) {
    return NextResponse.json({ error: "Channel not found." }, { status: 404 });
  }

<<<<<<< HEAD
=======
  if (!isLinkedInFeatureEnabled() && isLinkedInPlatform(account.platform)) {
    return NextResponse.json({ error: "LinkedIn is not available yet." }, { status: 400 });
  }

>>>>>>> 4d6e2ef9950540f1b3bcc52875ef8b65928e1ff8
  if (account.platform === "instagram" && !mediaPath) {
    return NextResponse.json({ error: "Instagram posts require an image." }, { status: 400 });
  }

  if (account.platform === "linkedin_organization" && !body.trim() && !mediaPath) {
    return NextResponse.json({ error: "LinkedIn posts require a caption or an image." }, { status: 400 });
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

    if (ideaId) {
      await markContentIdeaPromoted({
        ideaId,
        organizationId,
        postId: created.id,
      });
    }

<<<<<<< HEAD
=======
    if (created.status === "pending_approval") {
      void notifyPostSubmittedForApproval({
        postId: created.id,
        organizationId,
        submitterUserId: userId,
      }).catch((error) => {
        console.error("[SocialBD email:approval_request] Failed to send:", error);
      });
    }

>>>>>>> 4d6e2ef9950540f1b3bcc52875ef8b65928e1ff8
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
