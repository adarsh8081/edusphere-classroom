import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users";

export const parentStudents = pgTable("parent_students", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    parentId: varchar("parent_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
    unq: unique().on(t.parentId, t.studentId),
}));

export const parentInvitations = pgTable("parent_invitations", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    studentId: varchar("student_id").notNull(),
    parentEmail: text("parent_email").notNull(),
    token: text("token").notNull().unique(),
    status: text("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const parentMessages = pgTable("parent_messages", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    parentId: varchar("parent_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    teacherId: varchar("teacher_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    senderId: varchar("sender_id").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertParentMessageSchema = createInsertSchema(parentMessages).omit({ id: true, createdAt: true });
export type ParentInvitation = typeof parentInvitations.$inferSelect;
export type ParentMessage = typeof parentMessages.$inferSelect;
export type InsertParentMessage = z.infer<typeof insertParentMessageSchema>;
