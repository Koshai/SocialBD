CREATE TABLE IF NOT EXISTS "post" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "connected_account_id" text NOT NULL REFERENCES "connected_account"("id") ON DELETE CASCADE,
  "created_by_user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "body" text NOT NULL,
  "status" text NOT NULL DEFAULT 'draft',
  "scheduled_at" timestamptz,
  "published_at" timestamptz,
  "external_post_id" text,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS "post_organization_status_idx" ON "post" ("organization_id", "status");
