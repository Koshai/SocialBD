CREATE TABLE IF NOT EXISTS "campaign" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "campaign_org_name_idx"
  ON "campaign" ("organization_id", "name");

CREATE TABLE IF NOT EXISTS "content_tag" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "created_at" timestamptz NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "content_tag_org_name_idx"
  ON "content_tag" ("organization_id", "name");

CREATE TABLE IF NOT EXISTS "content_idea" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "campaign_id" text REFERENCES "campaign"("id") ON DELETE SET NULL,
  "created_by_user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "status" text NOT NULL DEFAULT 'brainstorm',
  "promoted_post_id" text REFERENCES "post"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS "content_idea_org_status_idx"
  ON "content_idea" ("organization_id", "status");

CREATE INDEX IF NOT EXISTS "content_idea_campaign_idx"
  ON "content_idea" ("campaign_id");

CREATE TABLE IF NOT EXISTS "content_idea_tag" (
  "idea_id" text NOT NULL REFERENCES "content_idea"("id") ON DELETE CASCADE,
  "tag_id" text NOT NULL REFERENCES "content_tag"("id") ON DELETE CASCADE,
  PRIMARY KEY ("idea_id", "tag_id")
);
