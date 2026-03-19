import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    email: text("email").notNull().unique(),
    password: text("password_hash"),
    name: text("name").notNull(),
    role: text("role").notNull(),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
    skills: jsonb("skills").$type<string[]>().default([]),
    provider: text("provider").default("local"),
    providerId: text("provider_id"),
    language: text("language").default("en"),
    accessibilityPreferences: jsonb("accessibility_preferences").default({
        ttsSpeed: 1,
        dyslexiaFont: false,
        highContrast: false,
        reduceMotion: false
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const notificationPreferences = pgTable("notification_preferences", {
    userId: varchar("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
    preferences: jsonb("preferences").notNull().default({
        newPost: { inApp: true, email: false, push: false },
        newComment: { inApp: true, email: false, push: false },
        assignmentCreated: { inApp: true, email: true, push: false },
        gradePublished: { inApp: true, email: true, push: false },
        attendanceMarked: { inApp: true, email: false, push: false }
    }),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true }).partial({ role: true });
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
