import { rejectPost } from "@socialbd/db";
import { NextResponse } from "next/server";

import { requireActiveOrganization } from "@/lib/dashboard-session";
<<<<<<< HEAD
=======
import { notifyPostRejected } from "@/lib/approval-notifications";
>>>>>>> 4d6e2ef9950540f1b3bcc52875ef8b65928e1ff8
import { canPublishDirectly, getMemberRoleForUser } from "@/lib/organization-roles";
type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { organizationId, userId } = await requireActiveOrganization();
  const role = await getMemberRoleForUser(userId, organizationId);

  if (!canPublishDirectly(role)) {
    return NextResponse.json({ error: "Only workspace admins can reject posts." }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    const post = await rejectPost(id, organizationId);
<<<<<<< HEAD
=======

    void notifyPostRejected({ postId: id, organizationId }).catch((error) => {
      console.error("[SocialBD email:approval_rejected] Failed to send:", error);
    });

>>>>>>> 4d6e2ef9950540f1b3bcc52875ef8b65928e1ff8
    return NextResponse.json({ ok: true, post });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not reject post.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
