import { reschedulePost } from "@socialbd/db";
import { NextResponse } from "next/server";

import { requireActiveOrganization } from "@/lib/dashboard-session";
import { enqueuePublishPost } from "@/lib/publish-queue";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { organizationId } = await requireActiveOrganization();
  const { id } = await context.params;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const scheduledAtRaw =
    typeof json === "object" && json !== null && "scheduledAt" in json
      ? (json as { scheduledAt: unknown }).scheduledAt
      : null;

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
