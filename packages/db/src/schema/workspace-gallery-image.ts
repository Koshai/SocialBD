import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";
import { organization } from "./organization";

export const workspaceGalleryImage = pgTable("workspace_gallery_image", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  uploadedByUserId: text("uploaded_by_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  mediaPath: text("media_path").notNull(),
  mediaMimeType: text("media_mime_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});
