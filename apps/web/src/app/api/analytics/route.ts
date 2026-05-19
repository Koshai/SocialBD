import { NextResponse } from "next/server";

import { buildAnalyticsSnapshot } from "@/lib/analytics-server";
import { requireActiveOrganization } from "@/lib/dashboard-session";

export async function GET() {
  const { organizationId } = await requireActiveOrganization();

  try {
    const snapshot = await buildAnalyticsSnapshot(organizationId);
    return NextResponse.json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load analytics.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
