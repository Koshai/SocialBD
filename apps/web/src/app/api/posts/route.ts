import { createPost, getConnectedAccountForOrganization } from "@socialbd/db";
import { NextResponse } from "next/server";

import { requireActiveOrganization } from "@/lib/dashboard-session";
import { enqueuePublishPost } from "@/lib/publish-queue";

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

  if (!connectedAccountId) {
    return NextResponse.json({ error: "Select a channel." }, { status: 400 });
  }

  const account = await getConnectedAccountForOrganization(connectedAccountId, organizationId);
  if (!account) {
    return NextResponse.json({ error: "Channel not found." }, { status: 404 });
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

  try {
    const created = await createPost({
      organizationId,
      connectedAccountId,
      createdByUserId: userId,
      body,
      scheduledAt: publishNow ? null : scheduledAt,
    });

    if (!created) {
      return NextResponse.json({ error: "Could not save post." }, { status: 500 });
    }

    if (publishNow) {
      await enqueuePublishPost(created.id);
    } else if (created.status === "scheduled" && created.scheduledAt) {
      await enqueuePublishPost(created.id, created.scheduledAt);
    }

    return NextResponse.json({
      post: created,
      publishing: publishNow || created.status === "scheduled",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save post.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
