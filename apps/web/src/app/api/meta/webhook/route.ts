import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
  createInboxEvent,
  getEnabledAgentForMetaPageOrIg,
} from "@socialbd/db";

import { enqueueMetaInboxEvent } from "@/lib/meta-inbox-queue";

export const runtime = "nodejs";

type MessagingItem = {
  sender?: { id?: string };
  recipient?: { id?: string };
  message?: {
    mid?: string;
    text?: string;
    is_echo?: boolean;
  };
  timestamp?: number;
};

type FeedChangeValue = {
  item?: string;
  verb?: string;
  comment_id?: string;
  post_id?: string;
  parent_id?: string;
  message?: string;
  text?: string;
  from?: { id?: string; name?: string; username?: string };
};

type WebhookEntry = {
  id?: string;
  messaging?: MessagingItem[];
  changes?: Array<{ field?: string; value?: FeedChangeValue }>;
};

type WebhookBody = {
  object?: string;
  entry?: WebhookEntry[];
};

function getVerifyToken() {
  return process.env.META_WEBHOOK_VERIFY_TOKEN?.trim() || "";
}

function verifySignature(rawBody: string, signatureHeader: string | null) {
  const appSecret = process.env.META_APP_SECRET?.trim();
  if (!appSecret) return false;
  if (!signatureHeader?.startsWith("sha256=")) return false;

  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  const provided = signatureHeader.slice("sha256=".length);
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(provided, "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function mentionsPage(text: string, pageName?: string | null) {
  const lower = text.toLowerCase();
  if (lower.includes("@")) return true;
  if (pageName && lower.includes(pageName.toLowerCase())) return true;
  return false;
}

async function ingestEvent(input: {
  pageOrIgId: string;
  platform: string;
  eventType: "messenger" | "comment" | "mention";
  externalId: string;
  senderId?: string | null;
  incomingText?: string | null;
  payload: unknown;
  skipWithoutMention?: boolean;
}) {
  const matched = await getEnabledAgentForMetaPageOrIg(input.pageOrIgId);
  if (!matched) {
    console.info(
      `[meta/webhook] No enabled agent for ${input.platform} id=${input.pageOrIgId} ` +
        `event=${input.eventType} (deploy/enable agent on that channel, or reconnect Meta).`,
    );
    return;
  }

  const { agent, account } = matched;

  if (input.eventType === "messenger" && !agent.replyMessenger) {
    console.info(
      `[meta/webhook] Agent ${agent.id} has messenger replies disabled for ${input.pageOrIgId}`,
    );
    return;
  }
  if ((input.eventType === "comment" || input.eventType === "mention") && !agent.replyComments) {
    return;
  }

  if (
    input.skipWithoutMention &&
    agent.requireMention &&
    input.incomingText &&
    !mentionsPage(input.incomingText, account.displayName)
  ) {
    return;
  }

  const { event, duplicate } = await createInboxEvent({
    organizationId: agent.organizationId,
    connectedAccountId: account.id,
    replyAgentId: agent.id,
    platform: input.platform,
    eventType: input.eventType,
    externalId: input.externalId,
    senderId: input.senderId ?? null,
    pageId: input.pageOrIgId,
    payload: JSON.stringify(input.payload),
    incomingText: input.incomingText ?? null,
  });

  if (duplicate || !event) return;
  console.info(
    `[meta/webhook] Queued ${input.eventType} event ${event.id} for agent ${agent.id} ` +
      `(${input.platform} ${input.pageOrIgId})`,
  );
  await enqueueMetaInboxEvent(event.id);
}

async function handleMessaging(objectType: string, entry: WebhookEntry) {
  const pageOrIgId = entry.id;
  if (!pageOrIgId || !entry.messaging?.length) return;

  const platform = objectType === "instagram" ? "instagram" : "facebook_page";

  for (const item of entry.messaging) {
    const message = item.message;
    if (!message || message.is_echo || !message.text?.trim()) continue;
    const mid = message.mid ?? `${pageOrIgId}:${item.timestamp}:${item.sender?.id}`;
    await ingestEvent({
      pageOrIgId,
      platform,
      eventType: "messenger",
      externalId: `msg:${mid}`,
      senderId: item.sender?.id ?? null,
      incomingText: message.text.trim(),
      payload: item,
    });
  }
}

async function handleChanges(objectType: string, entry: WebhookEntry) {
  const pageOrIgId = entry.id;
  if (!pageOrIgId || !entry.changes?.length) return;

  const platform = objectType === "instagram" ? "instagram" : "facebook_page";

  for (const change of entry.changes) {
    const value = change.value;
    if (!value) continue;

    if (change.field === "feed" || change.field === "comments") {
      if (value.item && value.item !== "comment") continue;
      if (value.verb && value.verb !== "add") continue;
      const commentId = value.comment_id;
      const text = (value.message ?? value.text ?? "").trim();
      if (!commentId || !text) continue;
      if (value.from?.id && value.from.id === pageOrIgId) continue;

      await ingestEvent({
        pageOrIgId,
        platform,
        eventType: "comment",
        externalId: `comment:${commentId}`,
        senderId: value.from?.id ?? null,
        incomingText: text,
        payload: change,
        skipWithoutMention: true,
      });
      continue;
    }

    if (change.field === "mention") {
      const commentId = value.comment_id ?? value.post_id;
      const text = (value.message ?? value.text ?? "").trim();
      if (!commentId || !text) continue;

      await ingestEvent({
        pageOrIgId,
        platform,
        eventType: "mention",
        externalId: `mention:${commentId}`,
        senderId: value.from?.id ?? null,
        incomingText: text,
        payload: change,
      });
    }
  }
}

/** Meta webhook verification (hub.challenge). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const verifyToken = getVerifyToken();

  if (mode === "subscribe" && verifyToken && token === verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: WebhookBody;
  try {
    body = JSON.parse(rawBody) as WebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const objectType = body.object ?? "page";
  if (objectType !== "page" && objectType !== "instagram") {
    return NextResponse.json({ ok: true });
  }

  const entryIds = (body.entry ?? []).map((e) => e.id).filter(Boolean);
  const messagingItems =
    body.entry?.reduce((n, e) => n + (e.messaging?.length ?? 0), 0) ?? 0;
  console.info(
    `[meta/webhook] POST object=${objectType} entries=${body.entry?.length ?? 0} ` +
      `messagingItems=${messagingItems} ids=${entryIds.join(",") || "(none)"}`,
  );

  try {
    for (const entry of body.entry ?? []) {
      await handleMessaging(objectType, entry);
      await handleChanges(objectType, entry);
    }
  } catch (error) {
    console.error("[meta/webhook] Failed to process payload", error);
  }

  // Always 200 quickly so Meta does not retry aggressively.
  return NextResponse.json({ ok: true });
}
