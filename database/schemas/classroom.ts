import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer, decimal, unique, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users";

export const classes = pgTable("classes", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    subject: text("subject"),
    grade: text("grade"),
    description: text("description"),
    classCode: text("class_code").notNull().unique(),
    teacherId: varchar("teacher_id").notNull(),
    meetingUrl: text("meeting_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const enrollments = pgTable("enrollments", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    classId: varchar("class_id").notNull(),
    studentId: varchar("student_id").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
    unq: unique().on(t.classId, t.studentId),
}));

export const posts = pgTable("posts", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    classId: varchar("class_id").notNull(),
    authorId: varchar("author_id").notNull(),
    content: text("content").notNull(),
    isPinned: boolean("is_pinned").default(false),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    sentiment: text("sentiment"),
    sentimentScore: decimal("sentiment_score", { precision: 3, scale: 2 }),
}, (t) => ({
    classIdx: index("post_class_id_idx").on(t.classId),
}));

export const comments = pgTable("comments", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    postId: varchar("post_id").notNull(),
    authorId: varchar("author_id").notNull(),
    parentId: varchar("parent_id"),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    sentiment: text("sentiment"),
    sentimentScore: decimal("sentiment_score", { precision: 3, scale: 2 }),
});

export const topics = pgTable("topics", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    classId: varchar("class_id").notNull(),
    name: text("name").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const resources = pgTable("resources", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    topicId: varchar("topic_id").notNull(),
    uploaderId: varchar("uploader_id"),
    title: text("title"),
    fileUrl: text("file_url").notNull(),
    fileType: text("file_type"),
    previousVersions: jsonb("previous_versions").$type<string[]>().default([]),
    summary: text("summary"),
    tags: jsonb("tags").$type<string[]>().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
    topicIdx: index("resource_topic_id_idx").on(t.topicId),
}));

export const resourceRecommendations = pgTable("resource_recommendations", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    resourceId: varchar("resource_id").notNull().references(() => resources.id),
    recommendedResourceId: varchar("recommended_resource_id").notNull().references(() => resources.id),
    score: decimal("score", { precision: 3, scale: 2 }).notNull(),
    reason: text("reason"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const polls = pgTable("polls", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    postId: varchar("post_id").notNull().unique().references(() => posts.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    multipleAnswers: boolean("multiple_answers").default(false),
    closesAt: timestamp("closes_at", { withTimezone: true }),
});

export const pollOptions = pgTable("poll_options", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    pollId: varchar("poll_id").notNull().references(() => polls.id, { onDelete: "cascade" }),
    optionText: text("option_text").notNull(),
    position: integer("position").notNull(),
});

export const pollVotes = pgTable("poll_votes", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    pollId: varchar("poll_id").notNull().references(() => polls.id, { onDelete: "cascade" }),
    optionId: varchar("option_id").notNull().references(() => pollOptions.id, { onDelete: "cascade" }),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
    unq: unique().on(t.pollId, t.userId, t.optionId),
}));

export const userActivities = pgTable("user_activities", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    classId: varchar("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
    activityType: text("activity_type").notNull(),
    referenceId: varchar("reference_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
    classUserIdx: index("user_activity_class_user_idx").on(t.classId, t.userId),
}));

export const studentRisk = pgTable("student_risk", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    enrollmentId: varchar("enrollment_id"),
    classId: varchar("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
    studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    riskScore: integer("risk_score").notNull(),
    riskFactors: text("risk_factors").array().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
    unq: unique().on(t.studentId, t.classId),
}));

export const insertClassSchema = createInsertSchema(classes).omit({ id: true, createdAt: true, classCode: true, teacherId: true });
export const insertPostSchema = createInsertSchema(posts).omit({ id: true, createdAt: true, updatedAt: true, authorId: true, classId: true });
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true, updatedAt: true, authorId: true });
export const insertTopicSchema = createInsertSchema(topics).omit({ id: true, createdAt: true, classId: true });
export const insertResourceSchema = createInsertSchema(resources).omit({ id: true, createdAt: true, uploaderId: true });

export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Topic = typeof topics.$inferSelect;
export type InsertTopic = z.infer<typeof insertTopicSchema>;
export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type StudentRisk = typeof studentRisk.$inferSelect;

