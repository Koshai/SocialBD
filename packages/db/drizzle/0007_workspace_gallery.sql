CREATE TABLE IF NOT EXISTS "workspace_gallery_image" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "uploaded_by_user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "category" text NOT NULL,
  "media_path" text NOT NULL,
  "media_mime_type" text NOT NULL,
  "created_at" timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS "workspace_gallery_org_category_idx"
  ON "workspace_gallery_image" ("organization_id", "category");

ALTER TABLE "content_idea"
  ADD COLUMN IF NOT EXISTS "workspace_gallery_id" text REFERENCES "workspace_gallery_image"("id") ON DELETE SET NULL;
