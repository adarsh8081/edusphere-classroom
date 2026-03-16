import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, unique } from "drizzle-orm/pg-core";
import { users } from "./users";

export const xpTransactions = pgTable("xp_transactions", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    reason: text("reason").notNull(),
    classId: varchar("class_id"),
    referenceId: varchar("reference_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const userLevels = pgTable("user_levels", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
    totalXp: integer("total_xp").notNull().default(0),
    level: integer("level").notNull().default(1),
    streak: integer("streak").notNull().default(0),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const badges = pgTable("badges", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    icon: text("icon").notNull(),
    xpBonus: integer("xp_bonus").notNull().default(0),
    criteria: jsonb("criteria").$type<Record<string, any>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const userBadges = pgTable("user_badges", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    badgeId: varchar("badge_id").notNull().references(() => badges.id, { onDelete: "cascade" }),
    earnedAt: timestamp("earned_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
    unq: unique().on(t.userId, t.badgeId),
}));

export type XpTransaction = typeof xpTransactions.$inferSelect;
export type UserLevel = typeof userLevels.$inferSelect;
export type Badge = typeof badges.$inferSelect;
export type UserBadge = typeof userBadges.$inferSelect;
