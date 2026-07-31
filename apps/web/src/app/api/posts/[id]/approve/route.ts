import { approvePost } from "@socialbd/db";
import { NextResponse } from "next/server";

import { requireActiveOrganization } from "@/lib/dashboard-session";
import { notifyPostApproved } from "@/lib/approval-notifications";
import { canPublishDirectly, getMemberRoleForUser } from "@/lib/organization-roles";
import { enqueuePublishPost } from "@/lib/publish-queue";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { organizationId, userId } = await requireActiveOrganization();
  const role = await getMemberRoleForUser(userId, organizationId);

  if (!canPublishDirectly(role)) {
    return NextResponse.json({ error: "Only workspace admins can approve posts." }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    const result = await approvePost(id, organizationId);
    if (result.publishNow) {
      await enqueuePublishPost(id);
    } else if (result.scheduledAt) {
      await enqueuePublishPost(id, result.scheduledAt);
    }

    void notifyPostApproved({
      postId: id,
      organizationId,
      publishNow: result.publishNow,
      scheduledAt: result.scheduledAt,
    }).catch((error) => {
      console.error("[QueueOra email:approval_approved] Failed to send:", error);
    });

    return NextResponse.json({ ok: true, post: result.post });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not approve post.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
