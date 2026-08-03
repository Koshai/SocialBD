import { and, desc, eq, or } from "drizzle-orm";

import { db } from "./db";
import { connectedAccount } from "./schema/connected-account";
import { inboxEvent, replyAgent } from "./schema/reply-agent";

export type ReplyAgentRow = typeof replyAgent.$inferSelect;
export type InboxEventRow = typeof inboxEvent.$inferSelect;

export type ReplyAgentWithChannel = ReplyAgentRow & {
  channelName: string;
  platform: string;
  providerAccountId: string;
};

export async function listReplyAgents(organizationId: string) {
  const rows = await db
    .select({
      id: replyAgent.id,
      organizationId: replyAgent.organizationId,
      connectedAccountId: replyAgent.connectedAccountId,
      name: replyAgent.name,
      templateId: replyAgent.templateId,
      systemPrompt: replyAgent.systemPrompt,
      language: replyAgent.language,
      tone: replyAgent.tone,
      replyMessenger: replyAgent.replyMessenger,
      replyComments: replyAgent.replyComments,
      requireMention: replyAgent.requireMention,
      enabled: replyAgent.enabled,
      createdAt: replyAgent.createdAt,
      updatedAt: replyAgent.updatedAt,
      channelName: connectedAccount.displayName,
      platform: connectedAccount.platform,
      providerAccountId: connectedAccount.providerAccountId,
    })
    .from(replyAgent)
    .innerJoin(connectedAccount, eq(replyAgent.connectedAccountId, connectedAccount.id))
    .where(eq(replyAgent.organizationId, organizationId))
    .orderBy(desc(replyAgent.updatedAt));

  return rows satisfies ReplyAgentWithChannel[];
}

export async function getReplyAgentForAccount(
  organizationId: string,
  connectedAccountId: string,
) {
  const [row] = await db
    .select()
    .from(replyAgent)
    .where(
      and(
        eq(replyAgent.organizationId, organizationId),
        eq(replyAgent.connectedAccountId, connectedAccountId),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function getReplyAgentWithAccountById(agentId: string) {
  const [row] = await db
    .select({
      agent: replyAgent,
      account: connectedAccount,
    })
    .from(replyAgent)
    .innerJoin(connectedAccount, eq(replyAgent.connectedAccountId, connectedAccount.id))
    .where(eq(replyAgent.id, agentId))
    .limit(1);

  return row ?? null;
}

export async function getEnabledAgentByProviderAccountId(providerAccountId: string) {
  const [row] = await db
    .select({
      agent: replyAgent,
      account: connectedAccount,
    })
    .from(replyAgent)
    .innerJoin(connectedAccount, eq(replyAgent.connectedAccountId, connectedAccount.id))
    .where(
      and(
        eq(connectedAccount.providerAccountId, providerAccountId),
        eq(connectedAccount.status, "active"),
        eq(replyAgent.enabled, true),
      ),
    )
    .limit(1);

  return row ?? null;
}

/**
 * Resolve FB Page id or IG user id to an enabled agent.
 * Messenger webhooks use Page id; IG messaging often uses IG user id.
 * IG accounts store linked Page as username `page:{pageId}` when no IG username,
 * or share the Page access token — we fall back to token match within the org.
 */
export async function getEnabledAgentForMetaPageOrIg(pageOrIgId: string) {
  const direct = await getEnabledAgentByProviderAccountId(pageOrIgId);
  if (direct) return direct;

  const byLinkedUsername = await db
    .select({
      agent: replyAgent,
      account: connectedAccount,
    })
    .from(replyAgent)
    .innerJoin(connectedAccount, eq(replyAgent.connectedAccountId, connectedAccount.id))
    .where(
      and(
        eq(connectedAccount.platform, "instagram"),
        eq(connectedAccount.username, `page:${pageOrIgId}`),
        eq(connectedAccount.status, "active"),
        eq(replyAgent.enabled, true),
      ),
    )
    .limit(1);

  if (byLinkedUsername[0]) return byLinkedUsername[0];

  const [pageAccount] = await db
    .select()
    .from(connectedAccount)
    .where(
      and(
        eq(connectedAccount.platform, "facebook_page"),
        eq(connectedAccount.providerAccountId, pageOrIgId),
        eq(connectedAccount.status, "active"),
      ),
    )
    .limit(1);

  if (!pageAccount) return null;

  const [igViaToken] = await db
    .select({
      agent: replyAgent,
      account: connectedAccount,
    })
    .from(replyAgent)
    .innerJoin(connectedAccount, eq(replyAgent.connectedAccountId, connectedAccount.id))
    .where(
      and(
        eq(connectedAccount.organizationId, pageAccount.organizationId),
        eq(connectedAccount.platform, "instagram"),
        eq(connectedAccount.accessToken, pageAccount.accessToken),
        eq(connectedAccount.status, "active"),
        eq(replyAgent.enabled, true),
      ),
    )
    .limit(1);

  if (igViaToken) return igViaToken;

  // Reverse: IG webhook id → fall back to Page agent sharing the same token.
  const [igAccount] = await db
    .select()
    .from(connectedAccount)
    .where(
      and(
        eq(connectedAccount.platform, "instagram"),
        eq(connectedAccount.providerAccountId, pageOrIgId),
        eq(connectedAccount.status, "active"),
      ),
    )
    .limit(1);

  if (igAccount) {
    const [pageViaToken] = await db
      .select({
        agent: replyAgent,
        account: connectedAccount,
      })
      .from(replyAgent)
      .innerJoin(connectedAccount, eq(replyAgent.connectedAccountId, connectedAccount.id))
      .where(
        and(
          eq(connectedAccount.organizationId, igAccount.organizationId),
          eq(connectedAccount.platform, "facebook_page"),
          eq(connectedAccount.accessToken, igAccount.accessToken),
          eq(connectedAccount.status, "active"),
          eq(replyAgent.enabled, true),
        ),
      )
      .limit(1);
    if (pageViaToken) return pageViaToken;
  }

  return null;
}

export async function upsertReplyAgent(input: {
  organizationId: string;
  connectedAccountId: string;
  name: string;
  templateId?: string | null;
  systemPrompt: string;
  language: string;
  tone: string;
  replyMessenger: boolean;
  replyComments: boolean;
  requireMention: boolean;
  enabled: boolean;
}) {
  const existing = await getReplyAgentForAccount(input.organizationId, input.connectedAccountId);
  const now = new Date();

  if (existing) {
    const [updated] = await db
      .update(replyAgent)
      .set({
        name: input.name,
        templateId: input.templateId ?? null,
        systemPrompt: input.systemPrompt,
        language: input.language,
        tone: input.tone,
        replyMessenger: input.replyMessenger,
        replyComments: input.replyComments,
        requireMention: input.requireMention,
        enabled: input.enabled,
        updatedAt: now,
      })
      .where(eq(replyAgent.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(replyAgent)
    .values({
      id: crypto.randomUUID(),
      organizationId: input.organizationId,
      connectedAccountId: input.connectedAccountId,
      name: input.name,
      templateId: input.templateId ?? null,
      systemPrompt: input.systemPrompt,
      language: input.language,
      tone: input.tone,
      replyMessenger: input.replyMessenger,
      replyComments: input.replyComments,
      requireMention: input.requireMention,
      enabled: input.enabled,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return created;
}

export async function createInboxEvent(input: {
  organizationId: string;
  connectedAccountId?: string | null;
  replyAgentId?: string | null;
  platform: string;
  eventType: string;
  externalId: string;
  senderId?: string | null;
  pageId?: string | null;
  payload: string;
  incomingText?: string | null;
}) {
  const now = new Date();
  try {
    const [row] = await db
      .insert(inboxEvent)
      .values({
        id: crypto.randomUUID(),
        organizationId: input.organizationId,
        connectedAccountId: input.connectedAccountId ?? null,
        replyAgentId: input.replyAgentId ?? null,
        platform: input.platform,
        eventType: input.eventType,
        externalId: input.externalId,
        senderId: input.senderId ?? null,
        pageId: input.pageId ?? null,
        payload: input.payload,
        incomingText: input.incomingText ?? null,
        replyText: null,
        status: "pending",
        error: null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return { event: row, duplicate: false as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("inbox_event_external_id") || message.includes("duplicate")) {
      return { event: null, duplicate: true as const };
    }
    throw error;
  }
}

export async function getInboxEventById(id: string) {
  const [row] = await db.select().from(inboxEvent).where(eq(inboxEvent.id, id)).limit(1);
  return row ?? null;
}

export async function updateInboxEventStatus(
  id: string,
  patch: {
    status: string;
    replyText?: string | null;
    error?: string | null;
  },
) {
  const [row] = await db
    .update(inboxEvent)
    .set({
      status: patch.status,
      replyText: patch.replyText ?? undefined,
      error: patch.error ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(inboxEvent.id, id))
    .returning();
  return row ?? null;
}

export async function listRecentInboxEvents(organizationId: string, limit = 30) {
  return db
    .select()
    .from(inboxEvent)
    .where(eq(inboxEvent.organizationId, organizationId))
    .orderBy(desc(inboxEvent.createdAt))
    .limit(limit);
}

export async function getConnectedAccountByProviderId(providerAccountId: string) {
  const [row] = await db
    .select()
    .from(connectedAccount)
    .where(
      and(eq(connectedAccount.providerAccountId, providerAccountId), eq(connectedAccount.status, "active")),
    )
    .limit(1);
  return row ?? null;
}

export async function listMetaChannelsForAgents(organizationId: string) {
  return db
    .select({
      id: connectedAccount.id,
      platform: connectedAccount.platform,
      displayName: connectedAccount.displayName,
      username: connectedAccount.username,
      providerAccountId: connectedAccount.providerAccountId,
      pictureUrl: connectedAccount.pictureUrl,
    })
    .from(connectedAccount)
    .where(
      and(
        eq(connectedAccount.organizationId, organizationId),
        eq(connectedAccount.status, "active"),
        or(
          eq(connectedAccount.platform, "facebook_page"),
          eq(connectedAccount.platform, "instagram"),
        ),
      ),
    )
    .orderBy(desc(connectedAccount.updatedAt));
}
