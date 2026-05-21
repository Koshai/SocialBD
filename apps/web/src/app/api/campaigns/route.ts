import { createCampaign, listCampaigns } from "@socialbd/db";
import { NextResponse } from "next/server";

import { requireActiveOrganization } from "@/lib/dashboard-session";

export async function GET() {
  const { organizationId } = await requireActiveOrganization();
  const campaigns = await listCampaigns(organizationId);
  return NextResponse.json({ campaigns });
}

export async function POST(request: Request) {
  const { organizationId } = await requireActiveOrganization();

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name =
    typeof json === "object" && json !== null && "name" in json
      ? String((json as { name: unknown }).name)
      : "";

  try {
    const campaign = await createCampaign({ organizationId, name });
    return NextResponse.json({ campaign });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create campaign.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
