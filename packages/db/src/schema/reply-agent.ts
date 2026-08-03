import { boolean, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { connectedAccount } from "./connected-account";
import { organization } from "./organization";

export const replyAgent = pgTable(
  "reply_agent",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    connectedAccountId: text("connected_account_id")
      .notNull()
      .references(() => connectedAccount.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    templateId: text("template_id"),
    systemPrompt: text("system_prompt").notNull(),
    language: text("language").notNull().default("en"),
    tone: text("tone").notNull().default("friendly"),
    replyMessenger: boolean("reply_messenger").notNull().default(true),
    replyComments: boolean("reply_comments").notNull().default(true),
    requireMention: boolean("require_mention").notNull().default(true),
    enabled: boolean("enabled").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("reply_agent_org_account_idx").on(table.organizationId, table.connectedAccountId),
  ],
);

export const inboxEvent = pgTable(
  "inbox_event",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    connectedAccountId: text("connected_account_id").references(() => connectedAccount.id, {
      onDelete: "set null",
    }),
    replyAgentId: text("reply_agent_id").references(() => replyAgent.id, { onDelete: "set null" }),
    platform: text("platform").notNull(),
    eventType: text("event_type").notNull(),
    externalId: text("external_id").notNull(),
    senderId: text("sender_id"),
    pageId: text("page_id"),
    payload: text("payload").notNull(),
    incomingText: text("incoming_text"),
    replyText: text("reply_text"),
    status: text("status").notNull().default("pending"),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex("inbox_event_external_id_idx").on(table.externalId)],
);
