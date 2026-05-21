import { rejectPost } from "@socialbd/db";
import { NextResponse } from "next/server";

import { requireActiveOrganization } from "@/lib/dashboard-session";
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
    return NextResponse.json({ ok: true, post });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not reject post.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
