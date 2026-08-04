import { notFound } from "next/navigation";
import {
  AGENT_TEMPLATES,
  listMetaChannelsForAgents,
  listRecentInboxEvents,
  listReplyAgents,
} from "@socialbd/db";

import { AgentsWorkspace } from "@/components/agents/agents-workspace";
import { requireActiveOrganization } from "@/lib/dashboard-session";
import { isAgentsFeatureEnabled } from "@/lib/features/agents";

export default async function AgentsPage() {
  if (!isAgentsFeatureEnabled()) {
    notFound();
  }

  const { organizationId } = await requireActiveOrganization();
  const [agents, events, channels] = await Promise.all([
    listReplyAgents(organizationId),
    listRecentInboxEvents(organizationId, 40),
    listMetaChannelsForAgents(organizationId),
  ]);

  const initialData = {
    agents,
    events: events.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      platform: event.platform,
      status: event.status,
      incomingText: event.incomingText,
      replyText: event.replyText,
      error: event.error,
      createdAt:
        event.createdAt instanceof Date ? event.createdAt.toISOString() : String(event.createdAt),
    })),
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
  };

  return <AgentsWorkspace initialData={initialData} />;
}
