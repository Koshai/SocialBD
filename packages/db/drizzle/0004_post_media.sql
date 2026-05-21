ALTER TABLE "post" ADD COLUMN IF NOT EXISTS "media_path" text;
ALTER TABLE "post" ADD COLUMN IF NOT EXISTS "media_mime_type" text;
