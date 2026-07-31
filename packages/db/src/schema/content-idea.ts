import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";
import { campaign } from "./campaign";
import { organization } from "./organization";
import { post } from "./post";
import { workspaceGalleryImage } from "./workspace-gallery-image";

export const contentIdea = pgTable("content_idea", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  campaignId: text("campaign_id").references(() => campaign.id, { onDelete: "set null" }),
  createdByUserId: text("created_by_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull().default("brainstorm"),
  promotedPostId: text("promoted_post_id").references(() => post.id, { onDelete: "set null" }),
  galleryImageId: text("gallery_image_id"),
  workspaceGalleryId: text("workspace_gallery_id").references(() => workspaceGalleryImage.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});
