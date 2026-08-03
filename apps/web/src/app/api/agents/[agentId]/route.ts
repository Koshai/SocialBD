import { NextResponse } from "next/server";
import {
  deleteReplyAgent,
  getReplyAgentById,
  setReplyAgentEnabled,
} from "@socialbd/db";

import { isAgentsFeatureEnabled } from "@/lib/features/agents";
import { requireActiveOrganization } from "@/lib/dashboard-session";

type RouteContext = {
  params: Promise<{ agentId: string }>;
};

/** Toggle enabled (body: `{ enabled: boolean }`) or partial updates later. */
export async function PATCH(request: Request, context: RouteContext) {
  if (!isAgentsFeatureEnabled()) {
    return NextResponse.json({ error: "Agents feature is disabled." }, { status: 404 });
  }

  const { organizationId } = await requireActiveOrganization();
  const { agentId } = await context.params;
  if (!agentId?.trim()) {
    return NextResponse.json({ error: "agentId is required." }, { status: 400 });
  }

  const existing = await getReplyAgentById(organizationId, agentId.trim());
  if (!existing) {
    return NextResponse.json({ error: "Agent not found." }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof json !== "object" || json === null || !("enabled" in json)) {
    return NextResponse.json({ error: "enabled is required." }, { status: 400 });
  }

  const enabled = (json as { enabled: unknown }).enabled === true;
  const agent = await setReplyAgentEnabled(organizationId, agentId.trim(), enabled);
  if (!agent) {
    return NextResponse.json({ error: "Could not update agent." }, { status: 500 });
  }

  return NextResponse.json({ agent });
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!isAgentsFeatureEnabled()) {
    return NextResponse.json({ error: "Agents feature is disabled." }, { status: 404 });
  }

  const { organizationId } = await requireActiveOrganization();
  const { agentId } = await context.params;
  if (!agentId?.trim()) {
    return NextResponse.json({ error: "agentId is required." }, { status: 400 });
  }

  const existing = await getReplyAgentById(organizationId, agentId.trim());
  if (!existing) {
    return NextResponse.json({ error: "Agent not found." }, { status: 404 });
  }

  const deleted = await deleteReplyAgent(organizationId, agentId.trim());
  if (!deleted) {
    return NextResponse.json({ error: "Could not delete agent." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
