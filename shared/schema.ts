import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer, decimal, unique, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password_hash"), // nullable for OAuth users
  name: text("name").notNull(),
  role: text("role").notNull(), // 'super_admin', 'teacher', 'student', 'parent'
  avatarUrl: text("avatar_url"),
  provider: text("provider").default("local"), // 'local', 'google', 'github'
  providerId: text("provider_id"), // OAuth provider user ID
  language: text("language").default("en"),
  accessibilityPreferences: jsonb("accessibility_preferences").default({
    ttsSpeed: 1,
    dyslexiaFont: false,
    highContrast: false,
    reduceMotion: false
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const parentStudents = pgTable("parent_students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentId: varchar("parent_id").notNull(), // refs users.id
  studentId: varchar("student_id").notNull(), // refs users.id
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
  unq: unique().on(t.parentId, t.studentId),
}));

export const parentInvitations = pgTable("parent_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  parentEmail: text("parent_email").notNull(),
  token: text("token").notNull().unique(),
  status: text("status").notNull().default("pending"), // 'pending', 'accepted', 'expired'
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
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
  sentiment: text("sentiment"),
  sentimentScore: decimal("sentiment_score", { precision: 3, scale: 2 }),
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
  previousVersions: jsonb("previous_versions").$type<string[]>().default([]),
  summary: text("summary"),
  tags: jsonb("tags").$type<string[]>().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
  topicIdx: index("resource_topic_id_idx").on(t.topicId),
}));

export const resourceRecommendations = pgTable("resource_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resourceId: varchar("resource_id").notNull(),
  recommendedResourceId: varchar("recommended_resource_id").notNull(),
  score: decimal("score", { precision: 3, scale: 2 }).notNull(),
  reason: text("reason"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

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

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // 'direct', 'group'
  name: text("name"), // for group chats
  classId: varchar("class_id"), // for class group chats
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const conversationParticipants = pgTable("conversation_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(),
  userId: varchar("user_id").notNull(),
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
  unq: unique().on(t.conversationId, t.userId),
}));

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(),
  senderId: varchar("sender_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const messageReads = pgTable("message_reads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").notNull(),
  userId: varchar("user_id").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
  unq: unique().on(t.messageId, t.userId),
}));

export const polls = pgTable("polls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().unique(),
  question: text("question").notNull(),
  multipleAnswers: boolean("multiple_answers").default(false),
  closesAt: timestamp("closes_at", { withTimezone: true }),
});

export const pollOptions = pgTable("poll_options", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pollId: varchar("poll_id").notNull(),
  optionText: text("option_text").notNull(),
  position: integer("position").notNull(),
});

export const pollVotes = pgTable("poll_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pollId: varchar("poll_id").notNull(),
  optionId: varchar("option_id").notNull(),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
  unq: unique().on(t.pollId, t.userId, t.optionId),
}));

export const prerequisites = pgTable("prerequisites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dependentOnId: varchar("dependent_on_id").notNull(),
  dependentOnType: text("dependent_on_type").notNull(), // 'assignment', 'resource'
  requiredForId: varchar("required_for_id").notNull(),
  requiredForType: text("required_for_type").notNull(), // 'assignment', 'resource'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").notNull(),
  reviewerId: varchar("reviewer_id").notNull(),
  submissionId: varchar("submission_id").notNull(),
  content: text("content"),
  score: decimal("score", { precision: 5, scale: 2 }),
  isFlagged: boolean("is_flagged").default(false),
  moderatedBy: varchar("moderated_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
  unq: unique().on(t.assignmentId, t.reviewerId, t.submissionId),
}));

export const studentRisk = pgTable("student_risk", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  enrollmentId: varchar("enrollment_id"),
  classId: varchar("class_id").notNull(),
  studentId: varchar("student_id").notNull(),
  riskScore: integer("risk_score").notNull(),
  riskFactors: text("risk_factors").array().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
  unq: unique().on(t.enrollmentId),
}));

export const notificationPreferences = pgTable("notification_preferences", {
  userId: varchar("user_id").primaryKey(),
  preferences: jsonb("preferences").notNull().default({
    newPost: { inApp: true, email: false, push: false },
    newComment: { inApp: true, email: false, push: false },
    assignmentCreated: { inApp: true, email: true, push: false },
    gradePublished: { inApp: true, email: true, push: false },
    attendanceMarked: { inApp: true, email: false, push: false }
  }),
});

export const userActivities = pgTable("user_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  classId: varchar("class_id").notNull(),
  activityType: text("activity_type").notNull(), // e.g., 'view_resource', 'create_comment', 'submit_assignment', 'login', 'bot_query'
  referenceId: varchar("reference_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
  classUserIdx: index("user_activity_class_user_idx").on(t.classId, t.userId),
}));



export const documentChunks = pgTable("document_chunks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resourceId: varchar("resource_id").notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  content: text("content").notNull(),
  // Use a standard JSONB array to store embeddings instead of custom driver
  // This bypasses Drizzle Zod errors while maintaining pgvector compatibility
  embedding: jsonb("embedding").$type<number[]>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const botConversations = pgTable("bot_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  classId: varchar("class_id").notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sources: jsonb("sources"),
  feedback: boolean("feedback"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const skills = pgTable("skills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: varchar("class_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  prerequisites: jsonb("prerequisites").$type<string[]>().default([]),
});

export const studentSkills = pgTable("student_skills", {
  studentId: varchar("student_id").notNull(),
  skillId: varchar("skill_id").notNull(),
  masteryLevel: integer("mastery_level").default(0), // 0-100
  lastUpdated: timestamp("last_updated", { withTimezone: true }).defaultNow(),
}, (t) => ({
  pk: unique().on(t.studentId, t.skillId), // Using unique constraint instead of composite primary key for simpler Drizzle inference
}));

export const wellbeingCheckins = pgTable("wellbeing_checkins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  classId: varchar("class_id").notNull(),
  moodScore: integer("mood_score").notNull(), // 1-5 (5 is best)
  notes: text("notes"),
  aiSentimentScore: integer("ai_sentiment_score"), // 1-100
  isFlagged: boolean("is_flagged").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
  studentClassIdx: index("wellbeing_student_class_idx").on(t.studentId, t.classId),
}));

export const learningPathItems = pgTable("learning_path_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  classId: varchar("class_id").notNull(),
  resourceId: varchar("resource_id"),
  assignmentId: varchar("assignment_id"),
  skillId: varchar("skill_id"),
  position: integer("position").notNull(),
  status: text("status").default('pending'), // 'pending', 'completed', 'skipped'
});

// v2 Ecosystem: Guilds (Discord-like Study Groups)
export const guilds = pgTable("guilds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  iconUrl: text("icon_url"),
  classId: varchar("class_id"), // Optional: guilds can be class-specific or general
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const guildMembers = pgTable("guild_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  guildId: varchar("guild_id").notNull(),
  userId: varchar("user_id").notNull(),
  role: text("role").notNull().default("member"), // 'admin', 'moderator', 'member'
  joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
  unq: unique().on(t.guildId, t.userId),
}));

export const guildChannels = pgTable("guild_channels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  guildId: varchar("guild_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull().default("text"), // 'text', 'voice'
  topic: text("topic"),
  position: integer("position").notNull().default(0),
});

// v2 Ecosystem: Forums (Reddit-like Knowledge Sharing)
export const forumPosts = pgTable("forum_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: varchar("author_id").notNull(),
  communityId: text("community_id").notNull().default("general"),
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  isPinned: boolean("is_pinned").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const forumComments = pgTable("forum_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull(),
  authorId: varchar("author_id").notNull(),
  parentId: varchar("parent_id"), // for nested threads
  content: text("content").notNull(),
  upvotes: integer("upvotes").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// v2 Ecosystem: Career Launchpad
export const careerPaths = pgTable("career_paths", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'web_dev', 'data_science', 'ai', etc.
  difficulty: text("difficulty").notNull(), // 'beginner', 'intermediate', 'advanced'
  estimatedHours: integer("estimated_hours"),
});

export const studentCareerProgress = pgTable("student_career_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull(),
  pathId: varchar("path_id").notNull(),
  status: text("status").notNull().default("not_started"), // 'enrolled', 'completed'
  enrolledAt: timestamp("enrolled_at", { withTimezone: true }).defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (t) => ({
  unq: unique().on(t.studentId, t.pathId),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertClassSchema = createInsertSchema(classes).omit({ id: true, createdAt: true, classCode: true, teacherId: true });
export const insertPostSchema = createInsertSchema(posts).omit({ id: true, createdAt: true, updatedAt: true, authorId: true, classId: true });
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true, updatedAt: true, authorId: true });
export const insertTopicSchema = createInsertSchema(topics).omit({ id: true, createdAt: true, classId: true });
export const insertResourceSchema = createInsertSchema(resources).omit({ id: true, createdAt: true, uploaderId: true });
export const insertAssignmentSchema = createInsertSchema(assignments).omit({ id: true, createdAt: true, createdBy: true, classId: true });
export const insertSubmissionSchema = createInsertSchema(submissions).omit({ id: true, submittedAt: true, gradedAt: true, studentId: true });

export const insertDocumentChunkSchema = createInsertSchema(documentChunks).omit({ id: true, createdAt: true });

export const insertBotConversationSchema = createInsertSchema(botConversations).omit({ id: true, createdAt: true });
export const insertSkillSchema = createInsertSchema(skills).omit({ id: true });
export const insertLearningPathItemSchema = createInsertSchema(learningPathItems).omit({ id: true });
export const insertWellbeingCheckinSchema = createInsertSchema(wellbeingCheckins).omit({ id: true, createdAt: true, aiSentimentScore: true, isFlagged: true });

// v2 Zod Schemas
export const insertGuildSchema = createInsertSchema(guilds).omit({ id: true, createdAt: true });
export const insertForumPostSchema = createInsertSchema(forumPosts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCareerPathSchema = createInsertSchema(careerPaths).omit({ id: true });

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
export type ResourceRecommendation = typeof resourceRecommendations.$inferSelect;
export type StudentRisk = typeof studentRisk.$inferSelect;
export type ParentInvitation = typeof parentInvitations.$inferSelect;

// Phase 4 Types
export type DocumentChunk = typeof documentChunks.$inferSelect;
export type BotConversation = typeof botConversations.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type StudentSkill = typeof studentSkills.$inferSelect;
export type LearningPathItem = typeof learningPathItems.$inferSelect;
export type WellbeingCheckin = typeof wellbeingCheckins.$inferSelect;

// v2 Phase Types
export type Guild = typeof guilds.$inferSelect;
export type ForumPost = typeof forumPosts.$inferSelect;
export type CareerPath = typeof careerPaths.$inferSelect;
