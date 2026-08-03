CREATE TABLE IF NOT EXISTS "reply_agent" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "connected_account_id" text NOT NULL REFERENCES "connected_account"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "template_id" text,
  "system_prompt" text NOT NULL,
  "language" text NOT NULL DEFAULT 'en',
  "tone" text NOT NULL DEFAULT 'friendly',
  "reply_messenger" boolean NOT NULL DEFAULT true,
  "reply_comments" boolean NOT NULL DEFAULT true,
  "require_mention" boolean NOT NULL DEFAULT true,
  "enabled" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "reply_agent_org_account_idx"
  ON "reply_agent" ("organization_id", "connected_account_id");

CREATE TABLE IF NOT EXISTS "inbox_event" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "connected_account_id" text REFERENCES "connected_account"("id") ON DELETE SET NULL,
  "reply_agent_id" text REFERENCES "reply_agent"("id") ON DELETE SET NULL,
  "platform" text NOT NULL,
  "event_type" text NOT NULL,
  "external_id" text NOT NULL,
  "sender_id" text,
  "page_id" text,
  "payload" text NOT NULL,
  "incoming_text" text,
  "reply_text" text,
  "status" text NOT NULL DEFAULT 'pending',
  "error" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "inbox_event_external_id_idx"
  ON "inbox_event" ("external_id");

CREATE INDEX IF NOT EXISTS "inbox_event_org_created_idx"
  ON "inbox_event" ("organization_id", "created_at" DESC);
