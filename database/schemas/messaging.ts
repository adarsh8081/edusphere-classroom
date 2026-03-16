import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, unique } from "drizzle-orm/pg-core";
import { users } from "./users";

export const conversations = pgTable("conversations", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    type: text("type").notNull(),
    name: text("name"),
    classId: varchar("class_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const conversationParticipants = pgTable("conversation_participants", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
    unq: unique().on(t.conversationId, t.userId),
}));

export const messages = pgTable("messages", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
    senderId: varchar("sender_id").notNull().references(() => users.id),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const messageReads = pgTable("message_reads", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    messageId: varchar("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    readAt: timestamp("read_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
    unq: unique().on(t.messageId, t.userId),
}));
