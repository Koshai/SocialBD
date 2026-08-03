import {
  getInboxEventById,
  getReplyAgentForAccount,
  getReplyAgentWithAccountById,
  replyToComment,
  resolveMessengerSendPageId,
  sendMessengerText,
  updateInboxEventStatus,
} from "@socialbd/db";

import { generateAgentReply } from "./openai-agent-reply";

export async function processMetaInboxJob(eventId: string) {
  const event = await getInboxEventById(eventId);
  if (!event) {
    console.warn(`[worker] Inbox event ${eventId} not found.`);
    return;
  }

  if (event.status === "replied" || event.status === "skipped") {
    return;
  }

  let matched =
    event.replyAgentId != null ? await getReplyAgentWithAccountById(event.replyAgentId) : null;

  if (!matched && event.connectedAccountId) {
    const agent = await getReplyAgentForAccount(event.organizationId, event.connectedAccountId);
    if (agent) {
      matched = await getReplyAgentWithAccountById(agent.id);
    }
  }

  if (!matched || !matched.agent.enabled) {
    await updateInboxEventStatus(eventId, {
      status: "skipped",
      error: "No enabled agent for this event.",
    });
    return;
  }

  const { agent, account } = matched;
  const incoming = event.incomingText?.trim();
  if (!incoming) {
    await updateInboxEventStatus(eventId, {
      status: "skipped",
      error: "Empty incoming text.",
    });
    return;
  }

  await updateInboxEventStatus(eventId, { status: "processing" });

  try {
    const replyText = await generateAgentReply({
      systemPrompt: agent.systemPrompt,
      language: agent.language,
      tone: agent.tone,
      incomingText: incoming,
      channelName: account.displayName,
      eventType: event.eventType,
    });

    if (event.eventType === "messenger") {
      if (!event.senderId) {
        throw new Error("Messenger event missing sender id.");
      }

      const isInstagram =
        event.platform === "instagram" || account.platform === "instagram";

      // IG webhooks use IG user id as entry.id; Send API needs linked Page id (or /me).
      const pageId = await resolveMessengerSendPageId({
        account,
        eventPlatform: event.platform,
        webhookEntryId: event.pageId,
      });

      await sendMessengerText({
        pageId,
        recipientId: event.senderId,
        text: replyText,
        pageAccessToken: account.accessToken,
        instagram: isInstagram,
      });
    } else if (event.eventType === "comment" || event.eventType === "mention") {
      let commentId: string | null = null;
      try {
        const payload = JSON.parse(event.payload) as {
          value?: { comment_id?: string };
          comment_id?: string;
        };
        commentId = payload.value?.comment_id ?? payload.comment_id ?? null;
      } catch {
        commentId = null;
      }
      if (!commentId && event.externalId.includes(":")) {
        commentId = event.externalId.split(":").slice(1).join(":");
      }
      if (!commentId) {
        throw new Error("Comment event missing comment id.");
      }

      await replyToComment({
        commentId,
        message: replyText,
        pageAccessToken: account.accessToken,
      });
    } else {
      throw new Error(`Unsupported event type: ${event.eventType}`);
    }

    await updateInboxEventStatus(eventId, {
      status: "replied",
      replyText,
      error: null,
    });
    console.log(`[worker] Replied to inbox event ${eventId}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await updateInboxEventStatus(eventId, {
      status: "failed",
      error: message,
    });
    console.error(`[worker] Inbox event ${eventId} failed:`, message);
    throw error;
  }
}
