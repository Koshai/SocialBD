CREATE TABLE IF NOT EXISTS "connected_account" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "platform" text NOT NULL,
  "provider_account_id" text NOT NULL,
  "display_name" text NOT NULL,
  "username" text,
  "picture_url" text,
  "access_token" text NOT NULL,
  "token_expires_at" timestamptz,
  "scopes" text,
  "status" text NOT NULL DEFAULT 'active',
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "connected_account_org_platform_provider_idx"
  ON "connected_account" ("organization_id", "platform", "provider_account_id");
