import { NextResponse } from "next/server";
import {
  AGENT_TEMPLATES,
  getConnectedAccountForOrganization,
  getTemplateSystemPrompt,
  listRecentInboxEvents,
  listReplyAgents,
  listMetaChannelsForAgents,
  upsertReplyAgent,
} from "@socialbd/db";

import { isAgentsFeatureEnabled } from "@/lib/features/agents";
import { requireActiveOrganization } from "@/lib/dashboard-session";

export async function GET() {
  if (!isAgentsFeatureEnabled()) {
    return NextResponse.json({ error: "Agents feature is disabled." }, { status: 404 });
  }

  const { organizationId } = await requireActiveOrganization();
  const [agents, events, channels] = await Promise.all([
    listReplyAgents(organizationId),
    listRecentInboxEvents(organizationId, 40),
    listMetaChannelsForAgents(organizationId),
  ]);

  return NextResponse.json({
    agents,
    events,
    channels,
    templates: AGENT_TEMPLATES.map((template) => ({
      id: template.id,
      name: template.name,
      nameBn: template.nameBn,
      description: template.description,
      descriptionBn: template.descriptionBn,
      category: template.category,
      systemPromptEn: template.systemPromptEn,
      systemPromptBn: template.systemPromptBn,
    })),
  });
}

export async function POST(request: Request) {
  if (!isAgentsFeatureEnabled()) {
    return NextResponse.json({ error: "Agents feature is disabled." }, { status: 404 });
  }

  const { organizationId } = await requireActiveOrganization();
  const body = (await request.json()) as {
    connectedAccountId?: string;
    name?: string;
    templateId?: string | null;
    systemPrompt?: string;
    language?: string;
    tone?: string;
    replyMessenger?: boolean;
    replyComments?: boolean;
    requireMention?: boolean;
    enabled?: boolean;
  };

  const connectedAccountId = body.connectedAccountId?.trim();
  if (!connectedAccountId) {
    return NextResponse.json({ error: "connectedAccountId is required." }, { status: 400 });
  }

  const account = await getConnectedAccountForOrganization(connectedAccountId, organizationId);
  if (!account) {
    return NextResponse.json({ error: "Channel not found." }, { status: 404 });
  }
  if (account.platform !== "facebook_page" && account.platform !== "instagram") {
    return NextResponse.json(
      { error: "Agents only support Facebook Pages and Instagram." },
      { status: 400 },
    );
  }

  const language = body.language === "bn" ? "bn" : "en";
  const templateId = body.templateId?.trim() || null;
  let systemPrompt = body.systemPrompt?.trim() || "";
  if (!systemPrompt && templateId) {
    systemPrompt = getTemplateSystemPrompt(templateId, language) ?? "";
  }
  if (!systemPrompt) {
    return NextResponse.json({ error: "systemPrompt is required." }, { status: 400 });
  }

  const template = templateId ? AGENT_TEMPLATES.find((item) => item.id === templateId) : null;
  const name =
    body.name?.trim() ||
    (template ? (language === "bn" ? template.nameBn : template.name) : null) ||
    `${account.displayName} agent`;

  const agent = await upsertReplyAgent({
    organizationId,
    connectedAccountId,
    name,
    templateId,
    systemPrompt,
    language,
    tone: body.tone?.trim() || "friendly",
    replyMessenger: body.replyMessenger !== false,
    replyComments: body.replyComments !== false,
    requireMention: body.requireMention !== false,
    enabled: body.enabled === true,
  });

  return NextResponse.json({ agent });
}
