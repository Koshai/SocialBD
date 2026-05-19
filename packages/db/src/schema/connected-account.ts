import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { organization } from "./organization";

export const connectedAccount = pgTable(
  "connected_account",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    displayName: text("display_name").notNull(),
    username: text("username"),
    pictureUrl: text("picture_url"),
    accessToken: text("access_token").notNull(),
    tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
    scopes: text("scopes"),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("connected_account_org_platform_provider_idx").on(
      table.organizationId,
      table.platform,
      table.providerAccountId,
    ),
  ],
);
