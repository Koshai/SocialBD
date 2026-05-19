import { getPostForPublish } from "@socialbd/db";
import { NextResponse } from "next/server";

import { requireActiveOrganization } from "@/lib/dashboard-session";
import { enqueuePublishPost } from "@/lib/publish-queue";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { organizationId } = await requireActiveOrganization();
  const { id } = await context.params;

  const row = await getPostForPublish(id, organizationId);
  if (!row) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  if (row.status !== "draft" && row.status !== "scheduled" && row.status !== "failed") {
    return NextResponse.json({ error: "This post cannot be published." }, { status: 400 });
  }

  const runAt =
    row.status === "scheduled" && row.scheduledAt && row.scheduledAt.getTime() > Date.now()
      ? row.scheduledAt
      : null;

  await enqueuePublishPost(id, runAt);

  return NextResponse.json({ ok: true });
}
