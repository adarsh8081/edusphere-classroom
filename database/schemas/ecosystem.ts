import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer, decimal, unique, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users";
import { classes, resources } from "./classroom";
import { assignments } from "./assignments";

export const skills = pgTable("skills", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    classId: varchar("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    prerequisites: jsonb("prerequisites").$type<string[]>().default([]),
});

export const studentSkills = pgTable("student_skills", {
    studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    skillId: varchar("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
    masteryLevel: integer("mastery_level").default(0),
    lastUpdated: timestamp("last_updated", { withTimezone: true }).defaultNow(),
}, (t) => ({
    pk: unique().on(t.studentId, t.skillId),
}));

export const wellbeingCheckins = pgTable("wellbeing_checkins", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    classId: varchar("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
    moodScore: integer("mood_score").notNull(),
    mood: text("mood").notNull(),
    notes: text("notes"),
    aiSentimentScore: integer("ai_sentiment_score"),
    isFlagged: boolean("is_flagged").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const learningPathItems = pgTable("learning_path_items", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    classId: varchar("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
    resourceId: varchar("resource_id").references(() => resources.id),
    assignmentId: varchar("assignment_id").references(() => assignments.id),
    skillId: varchar("skill_id").references(() => skills.id),
    position: integer("position").notNull(),
    status: text("status").default('pending'),
});

export const careerPaths = pgTable("career_paths", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    title: text("title").notNull(),
    description: text("description"),
    category: text("category").notNull(),
    difficulty: text("difficulty").notNull(),
    estimatedHours: integer("estimated_hours"),
});

export const studentCareerProgress = pgTable("student_career_progress", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    pathId: varchar("path_id").notNull().references(() => careerPaths.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("not_started"),
    enrolledAt: timestamp("enrolled_at", { withTimezone: true }).defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
}, (t) => ({
    unq: unique().on(t.studentId, t.pathId),
}));

export const portfolios = pgTable("portfolios", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
    isPublic: boolean("is_public").default(false),
    slug: text("slug").notNull().unique(),
    theme: text("theme").default("default"),
    bio: text("bio"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const portfolioItems = pgTable("portfolio_items", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    portfolioId: varchar("portfolio_id").notNull().references(() => portfolios.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    referenceId: varchar("reference_id").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    isVisible: boolean("is_visible").default(true),
    order: integer("order").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const certificates = pgTable("certificates", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    classId: varchar("class_id").references(() => classes.id, { onDelete: "set null" }),
    pathId: varchar("path_id").references(() => careerPaths.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    issuerName: text("issuer_name").notNull().default("EduSphere Academy"),
    verificationCode: text("verification_code").notNull().unique(),
    issuedAt: timestamp("issued_at", { withTimezone: true }).defaultNow(),
    metadata: jsonb("metadata"),
});

export const marketplaceItems = pgTable("marketplace_items", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    sellerId: varchar("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0.00"),
    category: text("category").notNull(),
    resourceId: varchar("resource_id").references(() => resources.id, { onDelete: "set null" }),
    previewUrl: text("preview_url"),
    tags: jsonb("tags").$type<string[]>().default([]),
    purchaseCount: integer("purchase_count").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const marketplacePurchases = pgTable("marketplace_purchases", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    buyerId: varchar("buyer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    itemId: varchar("item_id").notNull().references(() => marketplaceItems.id, { onDelete: "cascade" }),
    purchasedAt: timestamp("purchased_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
    unq: unique().on(t.buyerId, t.itemId),
}));

export const insertSkillSchema = createInsertSchema(skills).omit({ id: true });
export const insertLearningPathItemSchema = createInsertSchema(learningPathItems).omit({ id: true });
export const insertWellbeingCheckinSchema = createInsertSchema(wellbeingCheckins).omit({ id: true, createdAt: true, aiSentimentScore: true, isFlagged: true, studentId: true });
export const insertCareerPathSchema = createInsertSchema(careerPaths).omit({ id: true });
export const insertCertificateSchema = createInsertSchema(certificates).omit({ id: true, issuedAt: true });
export const insertPortfolioSchema = createInsertSchema(portfolios).omit({ id: true, createdAt: true });
export const insertPortfolioItemSchema = createInsertSchema(portfolioItems).omit({ id: true, createdAt: true });
export const insertMarketplaceItemSchema = createInsertSchema(marketplaceItems).omit({ id: true, createdAt: true, sellerId: true, purchaseCount: true });
export const insertMarketplacePurchaseSchema = createInsertSchema(marketplacePurchases).omit({ id: true, purchasedAt: true, buyerId: true });

export type Skill = typeof skills.$inferSelect;
export type StudentSkill = typeof studentSkills.$inferSelect;
export type LearningPathItem = typeof learningPathItems.$inferSelect;
export type WellbeingCheckin = typeof wellbeingCheckins.$inferSelect;
export type CareerPath = typeof careerPaths.$inferSelect;
export type Portfolio = typeof portfolios.$inferSelect;
export type PortfolioItem = typeof portfolioItems.$inferSelect;
export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type MarketplaceItem = typeof marketplaceItems.$inferSelect;
export type MarketplacePurchase = typeof marketplacePurchases.$inferSelect;
export type InsertMarketplaceItem = z.infer<typeof insertMarketplaceItemSchema>;
