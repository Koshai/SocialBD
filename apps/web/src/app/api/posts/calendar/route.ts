import { countScheduledPosts, listCalendarPosts } from "@socialbd/db";
import { NextResponse } from "next/server";

import { requireActiveOrganization } from "@/lib/dashboard-session";
import { serializeCalendarPosts } from "@/lib/calendar-api";

export async function GET(request: Request) {
  const { organizationId } = await requireActiveOrganization();
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "from and to query params are required." }, { status: 400 });
  }

  const rangeStart = new Date(from);
  const rangeEnd = new Date(to);

  if (Number.isNaN(rangeStart.getTime()) || Number.isNaN(rangeEnd.getTime())) {
    return NextResponse.json({ error: "Invalid date range." }, { status: 400 });
  }

  const [posts, scheduledCount] = await Promise.all([
    listCalendarPosts(organizationId, rangeStart, rangeEnd),
    countScheduledPosts(organizationId),
  ]);

  return NextResponse.json(serializeCalendarPosts(posts, scheduledCount));
}
