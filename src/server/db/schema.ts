import { pgTable, text, timestamp, uuid, pgEnum, integer, decimal } from "drizzle-orm/pg-core";

// Removed hardcoded statusEnum to support dynamic columns
// export const statusEnum = pgEnum("status", ['new', 'contacted', 'proposal', 'won', 'lost']);

export const columns = pgTable("columns", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  order: integer("order").notNull().default(0),
  organizationId: text("organization_id").notNull(),
  color: text("color"), // Optional color for UI
});

export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  company: text("company"),
  email: text("email"),
  whatsapp: text("whatsapp"),
  campaignSource: text("campaign_source"),
  status: text("status").notNull(), // Changed from enum to text to match column IDs or titles
  columnId: uuid("column_id").references(() => columns.id), // Link to dynamic columns
  position: integer("position").default(0).notNull(),
  organizationId: text("organization_id").notNull(),
  notes: text("notes"),
  value: decimal("value", { precision: 10, scale: 2 }), // New field for lead value
  followUpDate: timestamp("follow_up_date"), // When to follow up with this lead
  followUpNote: text("follow_up_note"), // Reason for follow-up
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Discovered columns (2026-01-21)
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  pagePath: text("page_path"),
});

export const settings = pgTable("settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: text("organization_id").notNull().unique(),
  companyName: text("company_name"),
  email: text("email"), // Archive user email
  viewMode: text("view_mode").default('kanban'), // Persist view preference
});

export const leadHistory = pgTable("lead_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: 'cascade' }).notNull(),
  userId: text("user_id"), // Can be null (e.g. Webhook)
  action: text("action").notNull(), // 'create', 'move', 'update', 'delete'
  fromColumn: uuid("from_column"),
  toColumn: uuid("to_column"),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Column = typeof columns.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type LeadHistory = typeof leadHistory.$inferSelect;
