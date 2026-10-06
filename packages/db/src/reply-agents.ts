import { and, desc, eq, like, ne, or } from "drizzle-orm";

import { db } from "./db";
import { connectedAccount } from "./schema/connected-account";
import { member, organization } from "./schema/organization";
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

export type MetaInboxEventKind = "messenger" | "comment" | "mention";

type AgentMatch = { agent: ReplyAgentRow; account: typeof connectedAccount.$inferSelect };

/**
 * The same Page/IG account can be connected (with an enabled agent) in several workspaces.
 * Prefer an agent that actually handles this event type, then the most recently updated one,
 * so Messenger and comment events for one Page resolve to the same workspace deterministically.
 */
function pickAgentForEvent(rows: AgentMatch[], eventKind?: MetaInboxEventKind) {
  if (rows.length === 0) return null;
  if (!eventKind) return rows[0];
  const handles = (row: AgentMatch) =>
    eventKind === "messenger" ? row.agent.replyMessenger : row.agent.replyComments;
  return rows.find(handles) ?? rows[0];
}

export async function getEnabledAgentByProviderAccountId(
  providerAccountId: string,
  eventKind?: MetaInboxEventKind,
) {
  const rows = await db
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
    .orderBy(desc(replyAgent.updatedAt));

  return pickAgentForEvent(rows, eventKind);
}

/** Parse linked Facebook Page id from IG account username (`page:{id}` or `handle|page:{id}`). */
export function parseLinkedPageIdFromIgUsername(username: string | null | undefined) {
  if (!username) return null;
  if (username.startsWith("page:")) return username.slice("page:".length) || null;
  const marker = "|page:";
  const idx = username.indexOf(marker);
  if (idx >= 0) return username.slice(idx + marker.length) || null;
  return null;
}

/**
 * Facebook Page id used for Instagram Send API (Page-linked IG).
 * Webhook entry id is the IG user id — never use that for POST .../messages.
 */
export async function resolveMessengerSendPageId(input: {
  account: {
    organizationId: string;
    platform: string;
    providerAccountId: string;
    username: string | null;
    accessToken: string;
  };
  eventPlatform: string;
  webhookEntryId?: string | null;
}) {
  const isInstagram =
    input.eventPlatform === "instagram" || input.account.platform === "instagram";

  if (!isInstagram) {
    return input.webhookEntryId ?? input.account.providerAccountId;
  }

  if (input.account.platform === "facebook_page") {
    return input.account.providerAccountId;
  }

  const fromUsername = parseLinkedPageIdFromIgUsername(input.account.username);
  if (fromUsername) return fromUsername;

  const [pageAccount] = await db
    .select()
    .from(connectedAccount)
    .where(
      and(
        eq(connectedAccount.organizationId, input.account.organizationId),
        eq(connectedAccount.platform, "facebook_page"),
        eq(connectedAccount.accessToken, input.account.accessToken),
        eq(connectedAccount.status, "active"),
      ),
    )
    .limit(1);

  if (pageAccount) return pageAccount.providerAccountId;

  // `/me/messages` with Page access token still works for IG.
  return "me";
}

/**
 * Resolve FB Page id or IG user id to an enabled agent.
 * Messenger webhooks use Page id; IG messaging often uses IG user id.
 * IG accounts store linked Page as username `page:{pageId}` when no IG username,
 * or share the Page access token — we fall back to token match within the org.
 */
export async function getEnabledAgentForMetaPageOrIg(
  pageOrIgId: string,
  eventKind?: MetaInboxEventKind,
) {
  const direct = await getEnabledAgentByProviderAccountId(pageOrIgId, eventKind);
  if (direct) return direct;

  // Legacy `page:{pageId}` and current `handle|page:{pageId}` encodings.
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
        or(
          eq(connectedAccount.username, `page:${pageOrIgId}`),
          like(connectedAccount.username, `%|page:${pageOrIgId}`),
        ),
        eq(connectedAccount.status, "active"),
        eq(replyAgent.enabled, true),
      ),
    )
    .orderBy(desc(replyAgent.updatedAt));

  const linkedMatch = pickAgentForEvent(byLinkedUsername, eventKind);
  if (linkedMatch) return linkedMatch;

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

/**
 * A Page/IG account can be connected in several workspaces, but webhooks can only be answered
 * by one agent. Returns the other workspace's live agent for the same channel, if any.
 * `workspaceName` is only revealed when the requesting user is a member of that workspace.
 */
export async function findLiveAgentConflict(input: {
  organizationId: string;
  connectedAccountId: string;
  userId: string;
}) {
  const [account] = await db
    .select({
      platform: connectedAccount.platform,
      providerAccountId: connectedAccount.providerAccountId,
    })
    .from(connectedAccount)
    .where(eq(connectedAccount.id, input.connectedAccountId))
    .limit(1);
  if (!account) return null;

  const [conflict] = await db
    .select({
      agentId: replyAgent.id,
      organizationId: replyAgent.organizationId,
      workspaceName: organization.name,
    })
    .from(replyAgent)
    .innerJoin(connectedAccount, eq(replyAgent.connectedAccountId, connectedAccount.id))
    .innerJoin(organization, eq(replyAgent.organizationId, organization.id))
    .where(
      and(
        eq(connectedAccount.platform, account.platform),
        eq(connectedAccount.providerAccountId, account.providerAccountId),
        eq(connectedAccount.status, "active"),
        eq(replyAgent.enabled, true),
        ne(replyAgent.organizationId, input.organizationId),
      ),
    )
    .limit(1);
  if (!conflict) return null;

  const [membership] = await db
    .select({ id: member.id })
    .from(member)
    .where(and(eq(member.organizationId, conflict.organizationId), eq(member.userId, input.userId)))
    .limit(1);

  return {
    agentId: conflict.agentId,
    workspaceName: membership ? conflict.workspaceName : null,
  };
}

export function liveAgentConflictMessage(workspaceName: string | null) {
  return workspaceName
    ? `This channel already has a live agent in your workspace "${workspaceName}". ` +
        "Turn it off or delete it there first — only one live agent per Page/Instagram account is allowed."
    : "This channel already has a live agent in another QueueOra workspace. " +
        "Only one live agent per Page/Instagram account is allowed.";
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

export async function getReplyAgentById(organizationId: string, agentId: string) {
  const [row] = await db
    .select()
    .from(replyAgent)
    .where(and(eq(replyAgent.id, agentId), eq(replyAgent.organizationId, organizationId)))
    .limit(1);
  return row ?? null;
}

export async function setReplyAgentEnabled(
  organizationId: string,
  agentId: string,
  enabled: boolean,
) {
  const [row] = await db
    .update(replyAgent)
    .set({ enabled, updatedAt: new Date() })
    .where(and(eq(replyAgent.id, agentId), eq(replyAgent.organizationId, organizationId)))
    .returning();
  return row ?? null;
}

export async function deleteReplyAgent(organizationId: string, agentId: string) {
  const [row] = await db
    .delete(replyAgent)
    .where(and(eq(replyAgent.id, agentId), eq(replyAgent.organizationId, organizationId)))
    .returning({ id: replyAgent.id });
  return Boolean(row);
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
