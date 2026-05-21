import {
  countIdeasByStatus,
  createContentIdea,
  listContentIdeas,
  type IdeaStatus,
} from "@socialbd/db";
import { NextResponse } from "next/server";

import { requireActiveOrganization } from "@/lib/dashboard-session";
import { serializeIdea, serializeIdeaCounts } from "@/lib/ideas-api";

const VALID_STATUSES = new Set(["all", "brainstorm", "ready", "archived"]);

export async function GET(request: Request) {
  const { organizationId } = await requireActiveOrganization();
  const { searchParams } = new URL(request.url);

  const statusRaw = searchParams.get("status") ?? "all";
  const status = VALID_STATUSES.has(statusRaw) ? statusRaw : "all";
  const campaignId = searchParams.get("campaignId") ?? "all";
  const tagId = searchParams.get("tagId") ?? "all";

  const [ideas, counts] = await Promise.all([
    listContentIdeas({
      organizationId,
      status: status === "all" ? "all" : (status as IdeaStatus),
      campaignId,
      tagId,
    }),
    countIdeasByStatus(organizationId),
  ]);

  return NextResponse.json({
    ideas: ideas.map(serializeIdea),
    counts: serializeIdeaCounts(counts),
  });
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
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const title = "title" in json ? String(json.title) : "";
  const body = "body" in json ? String(json.body) : "";
  const status =
    "status" in json && VALID_STATUSES.has(String(json.status)) && json.status !== "all"
      ? (String(json.status) as IdeaStatus)
      : undefined;
  const campaignId =
    "campaignId" in json && json.campaignId ? String(json.campaignId) : null;
  const tagNames =
    "tagNames" in json && Array.isArray(json.tagNames)
      ? json.tagNames.map(String)
      : [];

  try {
    const idea = await createContentIdea({
      organizationId,
      createdByUserId: userId,
      title,
      body,
      status,
      campaignId,
      tagNames,
    });
    return NextResponse.json({ idea: serializeIdea(idea) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save idea.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
