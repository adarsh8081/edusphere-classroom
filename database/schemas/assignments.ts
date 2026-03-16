import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer, decimal, unique, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users";
import { classes, topics } from "./classroom"; // Fixed cyclic or forward ref if needed

export const assignments = pgTable("assignments", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    classId: varchar("class_id").notNull(),
    topicId: varchar("topic_id"),
    title: text("title").notNull(),
    instructions: text("instructions"),
    dueDate: timestamp("due_date", { withTimezone: true }),
    maxPoints: integer("max_points"),
    isPeerReview: boolean("is_peer_review").default(false),
    reviewDeadline: timestamp("review_deadline", { withTimezone: true }),
    reviewsPerStudent: integer("reviews_per_student").default(2),
    createdBy: varchar("created_by"),
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
    plagiarismScore: integer("plagiarism_score"),
    plagiarismReport: jsonb("plagiarism_report"),
}, (t) => ({
    unq: unique().on(t.assignmentId, t.studentId),
}));

export const attendance = pgTable("attendance", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    classId: varchar("class_id").notNull(),
    studentId: varchar("student_id").notNull(),
    date: text("date").notNull(),
    status: text("status").notNull(),
    markedBy: varchar("marked_by"),
    markedAt: timestamp("marked_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
    unq: unique().on(t.classId, t.studentId, t.date),
}));

export const attendanceSessions = pgTable("attendance_sessions", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    classId: varchar("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
    teacherId: varchar("teacher_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    qrCode: text("qr_code").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const attendanceRecords = pgTable("attendance_records", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    sessionId: varchar("session_id").notNull().references(() => attendanceSessions.id, { onDelete: "cascade" }),
    studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    scannedAt: timestamp("scanned_at", { withTimezone: true }).defaultNow(),
    latitude: decimal("latitude", { precision: 10, scale: 7 }),
    longitude: decimal("longitude", { precision: 10, scale: 7 }),
}, (t) => ({
    unq: unique().on(t.sessionId, t.studentId),
}));

export const reviews = pgTable("reviews", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    assignmentId: varchar("assignment_id").notNull().references(() => assignments.id, { onDelete: "cascade" }),
    reviewerId: varchar("reviewer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    submissionId: varchar("submission_id").notNull().references(() => submissions.id, { onDelete: "cascade" }),
    content: text("content"),
    score: decimal("score", { precision: 5, scale: 2 }),
    isFlagged: boolean("is_flagged").default(false),
    moderatedBy: varchar("moderated_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
    unq: unique().on(t.assignmentId, t.reviewerId, t.submissionId),
}));

export const prerequisites = pgTable("prerequisites", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    dependentOnId: varchar("dependent_on_id").notNull(),
    dependentOnType: text("dependent_on_type").notNull(),
    requiredForId: varchar("required_for_id").notNull(),
    requiredForType: text("required_for_type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertAssignmentSchema = createInsertSchema(assignments).omit({ id: true, createdAt: true, createdBy: true, classId: true });
export const insertSubmissionSchema = createInsertSchema(submissions).omit({ id: true, submittedAt: true, gradedAt: true, studentId: true });

export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type AttendanceSession = typeof attendanceSessions.$inferSelect;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
