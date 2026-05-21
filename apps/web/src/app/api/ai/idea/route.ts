import { listCampaigns } from "@socialbd/db";
import { NextResponse } from "next/server";

import { requireActiveOrganization } from "@/lib/dashboard-session";
import { isCaptionTone } from "@/lib/openai-client";
import {
  brainstormContentIdeas,
  expandContentIdea,
  generateContentIdea,
} from "@/lib/openai-ideas";

const ACTIONS = new Set(["generate", "expand", "brainstorm"]);

export async function POST(request: Request) {
  const { organizationId } = await requireActiveOrganization();

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof json !== "object" || json === null) {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const action =
    "action" in json && ACTIONS.has(String(json.action)) ? String(json.action) : "generate";
  const brief = "brief" in json ? String(json.brief) : "";
  const title = "title" in json ? String(json.title) : "";
  const body = "body" in json ? String(json.body) : "";
  const toneRaw = "tone" in json ? String(json.tone) : "casual";
  const tone = isCaptionTone(toneRaw) ? toneRaw : "casual";
  const campaignId = "campaignId" in json && json.campaignId ? String(json.campaignId) : null;
  const count =
    "count" in json && typeof json.count === "number" ? json.count : undefined;

  let campaignName: string | null = null;
  if (campaignId) {
    const campaigns = await listCampaigns(organizationId);
    campaignName = campaigns.find((c) => c.id === campaignId)?.name ?? null;
  }

  try {
    if (action === "expand") {
      const idea = await expandContentIdea({
        brief,
        tone,
        title,
        body,
        campaignName,
      });
      return NextResponse.json({ idea });
    }

    if (action === "brainstorm") {
      const ideas = await brainstormContentIdeas({
        brief,
        tone,
        campaignName,
        count,
      });
      return NextResponse.json({ ideas });
    }

    const idea = await generateContentIdea({ brief, tone, campaignName });
    return NextResponse.json({ idea });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not generate with AI.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
