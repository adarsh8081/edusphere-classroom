import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users";
import { classes } from "./classroom";

export const guilds = pgTable("guilds", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    description: text("description"),
    iconUrl: text("icon_url"),
    classId: varchar("class_id").references(() => classes.id),
    createdBy: varchar("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const guildMembers = pgTable("guild_members", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    guildId: varchar("guild_id").notNull().references(() => guilds.id, { onDelete: "cascade" }),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
    unq: unique().on(t.guildId, t.userId),
}));

export const guildChannels = pgTable("guild_channels", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    guildId: varchar("guild_id").notNull().references(() => guilds.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type").notNull().default("text"),
    topic: text("topic"),
    position: integer("position").notNull().default(0),
});

export const forumPosts = pgTable("forum_posts", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    title: text("title").notNull(),
    content: text("content").notNull(),
    authorId: varchar("author_id").notNull().references(() => users.id),
    communityId: text("community_id").notNull().default("general"),
    upvotes: integer("upvotes").default(0),
    downvotes: integer("downvotes").default(0),
    isPinned: boolean("is_pinned").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const forumComments = pgTable("forum_comments", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    postId: varchar("post_id").notNull().references(() => forumPosts.id, { onDelete: "cascade" }),
    authorId: varchar("author_id").notNull().references(() => users.id),
    parentId: varchar("parent_id"),
    content: text("content").notNull(),
    upvotes: integer("upvotes").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertGuildSchema = createInsertSchema(guilds).omit({ id: true, createdAt: true });
export const insertForumPostSchema = createInsertSchema(forumPosts).omit({ id: true, createdAt: true, updatedAt: true });

export type Guild = typeof guilds.$inferSelect;
export type ForumPost = typeof forumPosts.$inferSelect;
