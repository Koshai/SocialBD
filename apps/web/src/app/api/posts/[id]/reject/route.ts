import { rejectPost } from "@socialbd/db";
import { NextResponse } from "next/server";

import { requireActiveOrganization } from "@/lib/dashboard-session";
import { notifyPostRejected } from "@/lib/approval-notifications";
import { resolveCanPublishDirectly } from "@/lib/organization-roles";
type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { organizationId, userId } = await requireActiveOrganization();
  const canPublish = await resolveCanPublishDirectly(userId, organizationId);

  if (!canPublish) {
    return NextResponse.json({ error: "Only workspace admins can reject posts." }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    const post = await rejectPost(id, organizationId);

    void notifyPostRejected({ postId: id, organizationId }).catch((error) => {
      console.error("[QueueOra email:approval_rejected] Failed to send:", error);
    });

    return NextResponse.json({ ok: true, post });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not reject post.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
