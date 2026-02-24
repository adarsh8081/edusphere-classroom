import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer, decimal, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(), // 'super_admin', 'teacher', 'student'
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const classes = pgTable("classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  subject: text("subject"),
  grade: text("grade"),
  description: text("description"),
  classCode: text("class_code").notNull().unique(),
  teacherId: varchar("teacher_id").notNull(), // refs users.id
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
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const postAttachments = pgTable("post_attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull(),
  authorId: varchar("author_id").notNull(),
  parentId: varchar("parent_id"), // self-reference
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const reactions = pgTable("reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  postId: varchar("post_id"),
  commentId: varchar("comment_id"),
  emoji: text("emoji").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
  unq: unique().on(t.userId, t.postId, t.commentId, t.emoji),
}));

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
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const assignments = pgTable("assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: varchar("class_id").notNull(),
  topicId: varchar("topic_id"),
  title: text("title").notNull(),
  instructions: text("instructions"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  maxPoints: integer("max_points"),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const assignmentAttachments = pgTable("assignment_attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const submissions = pgTable("submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").notNull(),
  studentId: varchar("student_id").notNull(),
  content: text("content"),
  fileUrl: text("file_url"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow(),
  grade: decimal("grade", { precision: 5, scale: 2 }),
  feedback: text("feedback"),
  gradedAt: timestamp("graded_at", { withTimezone: true }),
}, (t) => ({
  unq: unique().on(t.assignmentId, t.studentId),
}));

export const attendance = pgTable("attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: varchar("class_id").notNull(),
  studentId: varchar("student_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  status: text("status").notNull(), // 'present', 'absent', 'late'
  markedBy: varchar("marked_by"),
  markedAt: timestamp("marked_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
  unq: unique().on(t.classId, t.studentId, t.date),
}));

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(),
  referenceId: varchar("reference_id"),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertClassSchema = createInsertSchema(classes).omit({ id: true, createdAt: true, classCode: true, teacherId: true });
export const insertPostSchema = createInsertSchema(posts).omit({ id: true, createdAt: true, updatedAt: true, authorId: true, classId: true });
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true, updatedAt: true, authorId: true });
export const insertTopicSchema = createInsertSchema(topics).omit({ id: true, createdAt: true, classId: true });
export const insertResourceSchema = createInsertSchema(resources).omit({ id: true, createdAt: true, uploaderId: true });
export const insertAssignmentSchema = createInsertSchema(assignments).omit({ id: true, createdAt: true, createdBy: true, classId: true });
export const insertSubmissionSchema = createInsertSchema(submissions).omit({ id: true, submittedAt: true, gradedAt: true, studentId: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
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
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
