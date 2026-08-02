import { addMonths } from "@/lib/calendar";
import { duplicatePosts, listPostsByIds } from "@socialbd/db";
import { NextResponse } from "next/server";

import { requireActiveOrganization } from "@/lib/dashboard-session";
import { enqueuePublishPost } from "@/lib/publish-queue";

function sourceDisplayAt(post: {
  scheduledAt: Date | null;
  createdAt: Date;
}) {
  return post.scheduledAt ?? post.createdAt;
}

function shiftDate(date: Date, shiftMs: number | undefined, shiftMonths: number | undefined) {
  if (typeof shiftMonths === "number" && shiftMonths !== 0) {
    return addMonths(date, shiftMonths);
  }
  const ms = typeof shiftMs === "number" ? shiftMs : 0;
  return new Date(date.getTime() + ms);
}

/** Keep source time-of-day on the given calendar day. */
function atTimeOnDay(source: Date, targetDay: Date) {
  const result = new Date(targetDay);
  result.setHours(
    source.getHours(),
    source.getMinutes(),
    source.getSeconds(),
    source.getMilliseconds(),
  );
  return result;
}

function parseTargetDay(raw: string) {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  day.setHours(0, 0, 0, 0);
  return day;
}

export async function POST(request: Request) {
  const { organizationId, userId } = await requireActiveOrganization();

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof json !== "object" || json === null) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const body = json as {
    postIds?: unknown;
    shiftMs?: unknown;
    shiftMonths?: unknown;
    targetDate?: unknown;
  };

  const postIds = Array.isArray(body.postIds)
    ? body.postIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
    : [];

  if (postIds.length === 0) {
    return NextResponse.json({ error: "Select at least one post to duplicate." }, { status: 400 });
  }

  const shiftMs = typeof body.shiftMs === "number" ? body.shiftMs : undefined;
  const shiftMonths = typeof body.shiftMonths === "number" ? body.shiftMonths : undefined;
  const targetDateRaw = typeof body.targetDate === "string" ? body.targetDate.trim() : "";
  const targetDay = targetDateRaw ? parseTargetDay(targetDateRaw) : null;

  if (targetDateRaw && !targetDay) {
    return NextResponse.json({ error: "Invalid targetDate." }, { status: 400 });
  }

  if (!targetDay && shiftMs === undefined && shiftMonths === undefined) {
    return NextResponse.json(
      { error: "Provide targetDate, shiftMs, or shiftMonths for the paste target." },
      { status: 400 },
    );
  }

  const sources = await listPostsByIds(postIds, organizationId);
  if (sources.length === 0) {
    return NextResponse.json({ error: "No posts found to duplicate." }, { status: 404 });
  }

  const scheduledAtByPostId: Record<string, Date> = {};
  for (const source of sources) {
    const displayAt = sourceDisplayAt(source);
    scheduledAtByPostId[source.id] = targetDay
      ? atTimeOnDay(displayAt, targetDay)
      : shiftDate(displayAt, shiftMs, shiftMonths);
  }

  try {
    const created = await duplicatePosts({
      organizationId,
      createdByUserId: userId,
      sourcePostIds: sources.map((s) => s.id),
      scheduledAtByPostId,
    });

    for (const row of created) {
      if (row.status === "scheduled" && row.scheduledAt) {
        await enqueuePublishPost(row.id, row.scheduledAt);
      }
    }

    return NextResponse.json({
      createdCount: created.length,
      posts: created.map((row) => ({
        id: row.id,
        status: row.status,
        scheduledAt: row.scheduledAt?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not duplicate posts.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
