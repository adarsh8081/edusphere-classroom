import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users";
import { classes, resources, topics } from "./classroom";
import { skills } from "./ecosystem";

export const documentChunks = pgTable("document_chunks", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    resourceId: varchar("resource_id").notNull().references(() => resources.id, { onDelete: "cascade" }),
    chunkIndex: integer("chunk_index").notNull(),
    content: text("content").notNull(),
    embedding: jsonb("embedding").$type<number[]>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const botConversations = pgTable("bot_conversations", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    classId: varchar("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    sources: jsonb("sources"),
    feedback: boolean("feedback"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const learningGaps = pgTable("learning_gaps", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    classId: varchar("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
    topicId: varchar("topic_id").references(() => topics.id, { onDelete: "set null" }),
    skillId: varchar("skill_id").references(() => skills.id, { onDelete: "set null" }),
    subject: text("subject").notNull(),
    confidenceLevel: integer("confidence_level").notNull(),
    weaknessAnalysis: text("weakness_analysis"),
    suggestedResources: jsonb("suggested_resources").$type<string[]>().default([]),
    status: text("status").notNull().default('active'),
    lastAnalyzedAt: timestamp("last_analyzed_at", { withTimezone: true }).defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const aiStudyPlans = pgTable("ai_study_plans", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    classId: varchar("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
    weekStartDate: text("week_start_date").notNull(),
    planJson: jsonb("plan_json").$type<any>().notNull(),
    isCurrent: boolean("is_current").default(true),
    generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow(),
});

export const insertDocumentChunkSchema = createInsertSchema(documentChunks).omit({ id: true, createdAt: true });
export const insertBotConversationSchema = createInsertSchema(botConversations).omit({ id: true, createdAt: true });
export const insertLearningGapSchema = createInsertSchema(learningGaps).omit({ id: true, createdAt: true, lastAnalyzedAt: true });
export const insertAIStudyPlanSchema = createInsertSchema(aiStudyPlans).omit({ id: true, generatedAt: true });

export type DocumentChunk = typeof documentChunks.$inferSelect;
export type BotConversation = typeof botConversations.$inferSelect;
export type LearningGap = typeof learningGaps.$inferSelect;
export type InsertLearningGap = z.infer<typeof insertLearningGapSchema>;
export type AIStudyPlan = typeof aiStudyPlans.$inferSelect;
export type InsertAIStudyPlan = z.infer<typeof insertAIStudyPlanSchema>;
