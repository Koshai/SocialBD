import { pgTable, text, primaryKey } from "drizzle-orm/pg-core";

import { contentIdea } from "./content-idea";
import { contentTag } from "./content-tag";

export const contentIdeaTag = pgTable(
  "content_idea_tag",
  {
    ideaId: text("idea_id")
      .notNull()
      .references(() => contentIdea.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => contentTag.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.ideaId, table.tagId] })],
);
