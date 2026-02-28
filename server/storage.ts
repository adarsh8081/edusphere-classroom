import { db } from "./db";
import { eq, and, gte, sql, desc, count, ne, like, or } from "drizzle-orm";
import {
  users, classes, enrollments, posts, comments, topics, resources, assignments, submissions, attendance, notifications,
  parentStudents, parentInvitations, conversations, conversationParticipants, messages, messageReads, polls, pollOptions, pollVotes,
  prerequisites, reviews, studentRisk, resourceRecommendations, notificationPreferences, userActivities,
  guilds, guildMembers, guildChannels, forumPosts, forumComments, careerPaths, studentCareerProgress,
  type User, type InsertUser, type Class, type InsertClass, type Post, type InsertPost, type Comment, type InsertComment,
  type Topic, type InsertTopic, type Resource, type InsertResource, type Assignment, type InsertAssignment,
  type Submission, type InsertSubmission, type Attendance, type Notification,
  type Guild, type ForumPost, type CareerPath
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);
export const sessionStore = new MemoryStore({
  checkPeriod: 86400000 // prune expired entries every 24h
});

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByProvider(provider: string, providerId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createOAuthUser(data: { email: string; name: string; role: string; provider: string; providerId: string; avatarUrl?: string }): Promise<User>;

  // Parents
  linkParentToStudent(parentId: string, studentId: string): Promise<void>;
  getLinkedChildren(parentId: string): Promise<User[]>;
  getChildDashboard(studentId: string): Promise<{ classes: Class[], assignments: Assignment[], submissions: Submission[], attendance: Attendance[] }>;

  // Classes & Communication
  createClass(cls: InsertClass & { classCode: string, teacherId: string }): Promise<Class>;
  getClass(id: string): Promise<Class | undefined>;
  getClassByCode(code: string): Promise<Class | undefined>;
  getClassesForUser(userId: string, role: string): Promise<any[]>;
  enrollStudent(classId: string, studentId: string): Promise<void>;
  getClassRoster(classId: string): Promise<User[]>;
  updateClassMeetingUrl(classId: string, meetingUrl: string): Promise<void>;

  // Messaging
  createConversation(type: string, name?: string, classId?: string): Promise<any>;
  addParticipant(conversationId: string, userId: string): Promise<void>;
  getConversations(userId: string): Promise<any[]>;
  getMessages(conversationId: string): Promise<any[]>;
  sendMessage(conversationId: string, senderId: string, content: string): Promise<any>;

  // Stream & Polls
  createPost(post: InsertPost & { classId: string, authorId: string, scheduledAt?: Date }): Promise<Post>;
  getPosts(classId: string): Promise<(Post & { author: User, comments: (Comment & { author: User })[] })[]>;
  createPoll(postId: string, question: string, options: string[]): Promise<void>;
  voteInPoll(pollId: string, optionId: string, userId: string): Promise<void>;
  getPoll(postId: string): Promise<any>;

  // Classwork Improvements
  createComment(comment: InsertComment & { authorId: string }): Promise<Comment>;
  createTopic(topic: InsertTopic & { classId: string }): Promise<Topic>;
  getTopics(classId: string): Promise<Topic[]>;
  addPrerequisite(dependentOnId: string, dependentOnType: string, requiredForId: string, requiredForType: string): Promise<void>;
  getPrerequisites(requiredForId: string): Promise<any[]>;

  // Resources
  getResource(id: string): Promise<Resource | undefined>;
  getResources(topicId: string): Promise<Resource[]>;
  createResource(resource: InsertResource & { topicId: string }): Promise<Resource>;
  updateResourceVersion(id: string, newFileUrl: string, newFileType?: string): Promise<Resource>;

  // Assignments & Reviews
  createAssignment(assignment: InsertAssignment & { classId: string, createdBy: string }): Promise<Assignment>;
  getAssignments(classId: string): Promise<Assignment[]>;
  getAssignment(id: string): Promise<Assignment | undefined>;
  createSubmission(submission: InsertSubmission & { studentId: string }): Promise<Submission>;
  getSubmissions(assignmentId: string): Promise<(Submission & { student: User })[]>;
  gradeSubmission(submissionId: string, grade: string, feedback?: string): Promise<Submission>;
  assignPeerReviews(assignmentId: string): Promise<void>;
  submitReview(assignmentId: string, reviewerId: string, submissionId: string, content: string, score: string): Promise<void>;
  getReviewsForAssignment(assignmentId: string): Promise<any[]>;
  updateReviewModeration(reviewId: string, score: string, isFlagged: boolean, moderatedBy: string): Promise<any>;
  getPost(postId: string): Promise<Post | undefined>;
  getPollById(pollId: string): Promise<any>;

  // Analytics & Logs
  logActivity(userId: string, classId: string, activityType: string, referenceId?: string): Promise<void>;
  getEngagementHeatmap(classId: string): Promise<any[]>;
  getAssignmentStats(assignmentId: string): Promise<any>;

  markAttendance(classId: string, date: string, records: { studentId: string, status: string }[], markedBy: string): Promise<void>;
  getAttendance(classId: string, date?: string): Promise<Attendance[]>;

  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notif: any): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;
  getNotificationPreferences(userId: string): Promise<any>;
  updateNotificationPreferences(userId: string, preferences: any): Promise<void>;
  getUserSubmissionsForClass(classId: string, studentId: string): Promise<any[]>;

  // Phase 3: AI & Parent Features
  createParentInvitation(studentId: string, parentEmail: string, token: string, expiresAt: Date): Promise<any>;
  getParentInvitation(token: string): Promise<any>;
  updateParentInvitationStatus(id: string, status: string): Promise<void>;
  updateResourceAI(resourceId: string, summary: string, tags: string[]): Promise<void>;
  updateSentiment(type: 'post' | 'comment', id: string, sentiment: string, score: number): Promise<void>;
  getClassSentiment(classId: string): Promise<any>;
  updateStudentRisk(studentId: string, classId: string, riskScore: number, riskFactors: string[]): Promise<void>;
  getAtRiskStudents(classId: string): Promise<any[]>;
  flagReview(reviewId: string, isFlagged: boolean, moderatedBy: string): Promise<void>;

  // Phase 4: Intelligent Classroom Companion
  insertDocumentChunks(chunks: { resourceId: string, chunkIndex: number, content: string, embedding?: number[] }[]): Promise<void>;
  searchDocumentChunks(queryEmbedding: number[], limit?: number): Promise<any[]>;
  saveBotConversation(userId: string, classId: string, question: string, answer: string, sources?: any): Promise<void>;
  getBotConversations(classId: string, userId?: string): Promise<any[]>;

  createSkill(skill: any): Promise<any>;
  updateStudentSkill(studentId: string, skillId: string, points: number): Promise<void>;
  getStudentSkills(studentId: string): Promise<any[]>;

  generateLearningPath(studentId: string, classId: string): Promise<any[]>;
  completeLearningPathItem(itemId: string): Promise<void>;

  // Phase 5: Emotional Intelligence
  createWellbeingCheckin(checkin: any): Promise<any>;
  getWellbeingAnalytics(classId: string): Promise<any[]>;

  // Admin Dashboard
  getAdminStats(): Promise<any>;
  getAllUsers(roleFilter?: string, search?: string): Promise<any[]>;
  updateUserRole(userId: string, role: string): Promise<any>;
  deleteUser(userId: string): Promise<void>;
  getAllClassesAdmin(): Promise<any[]>;
  deleteClass(classId: string): Promise<void>;
  getRecentActivity(limit?: number): Promise<any[]>;
  getAllFlaggedWellbeing(): Promise<any[]>;
  // v2 Ecosystem: Guilds
  createGuild(guild: any): Promise<Guild>;
  getGuilds(classId?: string): Promise<Guild[]>;
  getGuildChannels(guildId: string): Promise<any[]>;
  joinGuild(guildId: string, userId: string, role?: string): Promise<void>;

  // v2 Ecosystem: Forums
  createForumPost(post: any): Promise<ForumPost>;
  getForumPosts(communityId?: string): Promise<any[]>;
  getForumComments(postId: string): Promise<any[]>;
  voteForumPost(postId: string, userId: string, direction: 'up' | 'down'): Promise<void>;

  // v2 Ecosystem: Career Launchpad
  getCareerPaths(category?: string): Promise<CareerPath[]>;
  enrollInCareerPath(studentId: string, pathId: string): Promise<void>;
  getStudentCareerProgress(studentId: string): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUserByProvider(provider: string, providerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      and(eq(users.provider, provider), eq(users.providerId, providerId))
    );
    return user;
  }

  async createOAuthUser(data: { email: string; name: string; role: string; provider: string; providerId: string; avatarUrl?: string }): Promise<User> {
    const [user] = await db.insert(users).values({
      email: data.email,
      name: data.name,
      role: data.role,
      provider: data.provider,
      providerId: data.providerId,
      avatarUrl: data.avatarUrl || null,
    }).returning();
    return user;
  }

  async linkParentToStudent(parentId: string, studentId: string): Promise<void> {
    await db.insert(parentStudents).values({ parentId, studentId }).onConflictDoNothing();
  }

  async getLinkedChildren(parentId: string): Promise<User[]> {
    const links = await db.select().from(parentStudents).where(eq(parentStudents.parentId, parentId));
    const children = [];
    for (const link of links) {
      const child = await this.getUser(link.studentId);
      if (child) children.push(child);
    }
    return children;
  }

  async getChildDashboard(studentId: string): Promise<{ classes: Class[], assignments: Assignment[], submissions: Submission[], attendance: Attendance[] }> {
    const studentClasses = await this.getClassesForUser(studentId, 'student');
    const studentAssignments: Assignment[] = [];
    for (const cls of studentClasses) {
      const assignments = await this.getAssignments(cls.id);
      studentAssignments.push(...assignments);
    }
    const studentSubmissions = await db.select().from(submissions).where(eq(submissions.studentId, studentId));
    const studentAttendance = await db.select().from(attendance).where(eq(attendance.studentId, studentId));

    return {
      classes: studentClasses,
      assignments: studentAssignments,
      submissions: studentSubmissions,
      attendance: studentAttendance
    };
  }

  async createClass(cls: InsertClass & { classCode: string, teacherId: string }): Promise<Class> {
    const [created] = await db.insert(classes).values(cls).returning();
    return created;
  }

  async updateClassMeetingUrl(classId: string, meetingUrl: string): Promise<void> {
    await db.update(classes).set({ meetingUrl }).where(eq(classes.id, classId));
  }

  async getClass(id: string): Promise<Class | undefined> {
    const [cls] = await db.select().from(classes).where(eq(classes.id, id));
    return cls;
  }

  async getClassByCode(code: string): Promise<Class | undefined> {
    const [cls] = await db.select().from(classes).where(eq(classes.classCode, code));
    return cls;
  }

  async getClassesForUser(userId: string, role: string): Promise<any[]> {
    const userClasses = [];
    if (role === 'teacher') {
      const clsList = await db.select().from(classes).where(eq(classes.teacherId, userId));
      for (const cls of clsList) {
        const [enrolCount] = await db.select({ count: count() }).from(enrollments).where(eq(enrollments.classId, cls.id));
        const [activity] = await db.select({ count: count() }).from(userActivities).where(
          and(
            eq(userActivities.classId, cls.id),
            gte(userActivities.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
          )
        );
        userClasses.push({
          ...cls,
          enrolledCount: enrolCount.count,
          activityScore: activity.count
        });
      }
    } else {
      const enrolledList = await db.select().from(enrollments).where(eq(enrollments.studentId, userId));
      for (const e of enrolledList) {
        const [cls] = await db.select().from(classes).where(eq(classes.id, e.classId));
        if (cls) {
          const allAssignments = await db.select().from(assignments).where(eq(assignments.classId, cls.id));
          const userSubmissions = await db.select().from(submissions).where(eq(submissions.studentId, userId));
          const submissionMap = new Set(userSubmissions.map(s => s.assignmentId));
          const pendingCount = allAssignments.filter(a => !submissionMap.has(a.id)).length;

          const [latestSub] = await db.select().from(submissions).where(
            and(
              eq(submissions.studentId, userId),
              sql`${submissions.assignmentId} IN (SELECT id FROM assignments WHERE class_id = ${cls.id})`,
              sql`${submissions.grade} IS NOT NULL`
            )
          ).orderBy(desc(submissions.gradedAt)).limit(1);

          userClasses.push({
            ...cls,
            pendingAssignmentsCount: pendingCount,
            latestGrade: latestSub?.grade
          });
        }
      }
    }
    return userClasses;
  }

  async enrollStudent(classId: string, studentId: string): Promise<void> {
    await db.insert(enrollments).values({ classId, studentId }).onConflictDoNothing();
  }

  async getClassRoster(classId: string): Promise<User[]> {
    const enrolled = await db.select().from(enrollments).where(eq(enrollments.classId, classId));
    const [cls] = await db.select().from(classes).where(eq(classes.id, classId));

    const roster: User[] = [];
    if (cls) {
      const [teacher] = await db.select().from(users).where(eq(users.id, cls.teacherId));
      if (teacher) roster.push(teacher);
    }

    for (const e of enrolled) {
      const [student] = await db.select().from(users).where(eq(users.id, e.studentId));
      if (student) roster.push(student);
    }
    return roster;
  }

  // Messaging Methods
  async createConversation(type: string, name?: string, classId?: string): Promise<any> {
    const [conv] = await db.insert(conversations).values({ type, name, classId }).returning();
    return conv;
  }

  async addParticipant(conversationId: string, userId: string): Promise<void> {
    await db.insert(conversationParticipants).values({ conversationId, userId }).onConflictDoNothing();
  }

  async getConversations(userId: string): Promise<any[]> {
    const participations = await db.select().from(conversationParticipants).where(eq(conversationParticipants.userId, userId));
    const result = [];
    for (const p of participations) {
      const [conv] = await db.select().from(conversations).where(eq(conversations.id, p.conversationId));
      if (conv) {
        const lastMessages = await db.select().from(messages).where(eq(messages.conversationId, conv.id)).limit(1);
        result.push({ ...conv, lastMessage: lastMessages[0] });
      }
    }
    return result;
  }

  async getMessages(conversationId: string): Promise<any[]> {
    return await db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
  }

  async sendMessage(conversationId: string, senderId: string, content: string): Promise<any> {
    const [msg] = await db.insert(messages).values({ conversationId, senderId, content }).returning();
    return msg;
  }

  async createPost(post: InsertPost & { classId: string, authorId: string }): Promise<Post> {
    const [created] = await db.insert(posts).values(post).returning();
    return created;
  }

  async getPosts(classId: string) {
    const classPosts = await db.select().from(posts).where(eq(posts.classId, classId));
    const result = [];
    const now = new Date().getTime();
    for (const p of classPosts) {
      if (p.scheduledAt && new Date(p.scheduledAt).getTime() > now) continue;

      const [author] = await db.select().from(users).where(eq(users.id, p.authorId));
      const postComments = await db.select().from(comments).where(eq(comments.postId, p.id));
      const commentsWithAuthors = [];
      for (const c of postComments) {
        const [cAuthor] = await db.select().from(users).where(eq(users.id, c.authorId));
        commentsWithAuthors.push({ ...c, author: cAuthor });
      }
      result.push({ ...p, author, comments: commentsWithAuthors });
    }
    return result.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createComment(comment: InsertComment & { authorId: string }): Promise<Comment> {
    const [created] = await db.insert(comments).values(comment).returning();
    return created;
  }

  async createTopic(topic: InsertTopic & { classId: string }): Promise<Topic> {
    const [created] = await db.insert(topics).values(topic).returning();
    return created;
  }

  async getTopics(classId: string): Promise<Topic[]> {
    return await db.select().from(topics).where(eq(topics.classId, classId));
  }

  async addPrerequisite(dependentOnId: string, dependentOnType: string, requiredForId: string, requiredForType: string): Promise<void> {
    await db.insert(prerequisites).values({
      dependentOnId,
      dependentOnType,
      requiredForId,
      requiredForType
    }).onConflictDoNothing();
  }

  async getPrerequisites(requiredForId: string): Promise<any[]> {
    return await db.select().from(prerequisites).where(eq(prerequisites.requiredForId, requiredForId));
  }

  async createAssignment(assignment: InsertAssignment & { classId: string, createdBy: string }): Promise<Assignment> {
    const [created] = await db.insert(assignments).values({
      ...assignment,
      dueDate: assignment.dueDate ? new Date(assignment.dueDate) : null
    }).returning();
    return created;
  }

  async getAssignments(classId: string, userId?: string): Promise<any[]> {
    const classAssignments = await db.select().from(assignments).where(eq(assignments.classId, classId));

    let userSubmissionAssignmentIds = new Set<string>();
    if (userId) {
      const userSubs = await db.select().from(submissions).where(eq(submissions.studentId, userId));
      userSubs.forEach(s => userSubmissionAssignmentIds.add(s.assignmentId!));
    }

    const result = [];
    for (const a of classAssignments) {
      const reqs = await db.select().from(prerequisites).where(eq(prerequisites.requiredForId, a.id));
      const preReqIds = reqs.map(r => r.dependentOnId);

      let isLocked = false;
      if (userId && preReqIds.length > 0) {
        isLocked = preReqIds.some(id => !userSubmissionAssignmentIds.has(id));
      }

      result.push({ ...a, prerequisites: preReqIds, isLocked });
    }
    return result;
  }

  async getAssignment(id: string): Promise<Assignment | undefined> {
    const [a] = await db.select().from(assignments).where(eq(assignments.id, id));
    return a;
  }

  async createSubmission(submission: InsertSubmission & { studentId: string }): Promise<Submission> {
    const [created] = await db.insert(submissions).values(submission).onConflictDoUpdate({
      target: [submissions.assignmentId, submissions.studentId],
      set: { content: submission.content, fileUrl: submission.fileUrl, submittedAt: new Date() }
    }).returning();
    return created;
  }

  async getSubmissions(assignmentId: string) {
    const subs = await db.select().from(submissions).where(eq(submissions.assignmentId, assignmentId));
    const result = [];
    for (const s of subs) {
      const [student] = await db.select().from(users).where(eq(users.id, s.studentId));
      result.push({ ...s, student });
    }
    return result;
  }

  async gradeSubmission(submissionId: string, grade: string, feedback?: string): Promise<Submission> {
    const [updated] = await db.update(submissions)
      .set({ grade, feedback, gradedAt: new Date() })
      .where(eq(submissions.id, submissionId))
      .returning();
    return updated;
  }

  async markAttendance(classId: string, date: string, records: { studentId: string, status: string }[], markedBy: string): Promise<void> {
    for (const record of records) {
      await db.insert(attendance).values({
        classId,
        studentId: record.studentId,
        date,
        status: record.status,
        markedBy
      }).onConflictDoUpdate({
        target: [attendance.classId, attendance.studentId, attendance.date],
        set: { status: record.status, markedBy, markedAt: new Date() }
      });
    }
  }

  async getAttendance(classId: string, date?: string): Promise<Attendance[]> {
    if (date) {
      return await db.select().from(attendance).where(and(eq(attendance.classId, classId), eq(attendance.date, date)));
    }
    return await db.select().from(attendance).where(eq(attendance.classId, classId));
  }

  async createPoll(postId: string, question: string, options: string[]): Promise<void> {
    const [poll] = await db.insert(polls).values({ postId, question }).returning();
    for (let i = 0; i < options.length; i++) {
      await db.insert(pollOptions).values({ pollId: poll.id, optionText: options[i], position: i });
    }
  }

  async voteInPoll(pollId: string, optionId: string, userId: string): Promise<void> {
    await db.insert(pollVotes).values({ pollId, optionId, userId }).onConflictDoNothing();
  }

  async getPoll(postId: string): Promise<any> {
    const [poll] = await db.select().from(polls).where(eq(polls.postId, postId));
    if (!poll) return null;
    const options = await db.select().from(pollOptions).where(eq(pollOptions.pollId, poll.id));
    const votes = await db.select().from(pollVotes).where(eq(pollVotes.pollId, poll.id));
    return { ...poll, options, votes };
  }

  async getPost(postId: string): Promise<Post | undefined> {
    const [p] = await db.select().from(posts).where(eq(posts.id, postId));
    return p;
  }

  async getPollById(pollId: string): Promise<any> {
    const [poll] = await db.select().from(polls).where(eq(polls.id, pollId));
    return poll;
  }

  async assignPeerReviews(assignmentId: string): Promise<void> {
    const [assignment] = await db.select().from(assignments).where(eq(assignments.id, assignmentId));
    if (!assignment) return;

    const studentSubmissions = await this.getSubmissions(assignmentId);
    if (studentSubmissions.length < 2) return;

    // Check if reviews are already assigned
    const existingReviews = await db.select().from(reviews).where(eq(reviews.assignmentId, assignmentId));
    if (existingReviews.length > 0) return;

    const n = assignment.reviewsPerStudent || 2;
    const submissions = [...studentSubmissions];

    for (let i = 0; i < submissions.length; i++) {
      const submission = submissions[i];
      // Find potential reviewers (others who submitted)
      let partners = submissions.filter(s => s.studentId !== submission.studentId);

      // Shuffle and pick N
      const reviewers = partners
        .sort(() => 0.5 - Math.random())
        .slice(0, n);

      for (const reviewer of reviewers) {
        await db.insert(reviews).values({
          assignmentId,
          reviewerId: reviewer.studentId,
          submissionId: submission.id
        }).onConflictDoNothing();

        // Notify reviewer
        const { notificationService } = await import("./notification-service");
        await notificationService.notify(reviewer.studentId, 'assignment_review_assigned',
          'New Peer Review Assigned',
          `You have been assigned to review a submission for ${assignment.title}`,
          `/class/${assignment.classId}/assignments/${assignmentId}`
        );
      }
    }
  }

  async submitReview(assignmentId: string, reviewerId: string, submissionId: string, content: string, score: string): Promise<void> {
    await db.update(reviews)
      .set({ content, score })
      .where(and(eq(reviews.assignmentId, assignmentId), eq(reviews.reviewerId, reviewerId), eq(reviews.submissionId, submissionId)));

    // Notify author of submission
    const [submission] = await db.select().from(submissions).where(eq(submissions.id, submissionId));
    const [assignment] = await db.select().from(assignments).where(eq(assignments.id, assignmentId));
    if (submission && assignment) {
      const { notificationService } = await import("./notification-service");
      await notificationService.notify(submission.studentId, 'assignment_reviewed',
        'Submission Reviewed',
        `Your submission for ${assignment.title} has been reviewed by a peer.`,
        `/class/${assignment.classId}/assignments/${assignmentId}`
      );
    }
  }

  async getReviewsForAssignment(assignmentId: string): Promise<any[]> {
    const asmntReviews = await db.select().from(reviews).where(eq(reviews.assignmentId, assignmentId));
    const result = [];
    for (const r of asmntReviews) {
      const [reviewer] = await db.select().from(users).where(eq(users.id, r.reviewerId));
      result.push({ ...r, reviewer });
    }
    return result;
  }

  async updateReviewModeration(reviewId: string, score: string, isFlagged: boolean, moderatedBy: string): Promise<any> {
    const [updated] = await db.update(reviews)
      .set({ score, isFlagged, moderatedBy })
      .where(eq(reviews.id, reviewId))
      .returning();
    return updated;
  }

  async getResources(topicId: string): Promise<any[]> {
    return db.select().from(resources).where(eq(resources.topicId, topicId));
  }

  async createResource(data: any): Promise<any> {
    const [resource] = await db.insert(resources).values(data).returning();
    return resource;
  }

  async getResource(id: string): Promise<any> {
    const [resource] = await db.select().from(resources).where(eq(resources.id, id));
    return resource;
  }

  async updateResourceVersion(id: string, newFileUrl: string, newFileType?: string): Promise<Resource> {
    const resource = await this.getResource(id);
    if (!resource) throw new Error("Resource not found");

    const previousVersions = resource.previousVersions || [];
    previousVersions.push(resource.fileUrl);

    const [updated] = await db.update(resources)
      .set({
        fileUrl: newFileUrl,
        fileType: newFileType || resource.fileType,
        previousVersions
      })
      .where(eq(resources.id, id))
      .returning();

    return updated;
  }

  async updateStudentRisk(studentId: string, classId: string, riskScore: number, riskFactors: string[]): Promise<void> {
    const enrollmentId = `man-${studentId}-${classId}`;
    await db.insert(studentRisk).values({
      studentId,
      classId,
      enrollmentId,
      riskScore,
      riskFactors,
      updatedAt: new Date()
    })
      .onConflictDoUpdate({
        target: [studentRisk.studentId, studentRisk.classId],
        set: { riskScore, riskFactors, updatedAt: new Date() }
      });
  }

  async getStudentAttendance(studentId: string, classId: string): Promise<any[]> {
    return db.select().from(attendance).where(and(eq(attendance.studentId, studentId), eq(attendance.classId, classId)));
  }

  async getStudentSubmissions(studentId: string, classId: string): Promise<any[]> {
    // This requires joining with assignments to filter by classId
    return db.select({
      id: submissions.id,
      assignmentId: submissions.assignmentId,
      studentId: submissions.studentId,
      grade: submissions.grade,
      classId: assignments.classId
    })
      .from(submissions)
      .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
      .where(and(eq(submissions.studentId, studentId), eq(assignments.classId, classId)));
  }


  async logActivity(userId: string, classId: string, activityType: string, referenceId?: string): Promise<void> {
    await db.insert(userActivities).values({ userId, classId, activityType, referenceId });
  }

  async getEngagementHeatmap(classId: string): Promise<any[]> {
    return await db.select().from(userActivities).where(eq(userActivities.classId, classId));
  }

  async getAssignmentStats(assignmentId: string): Promise<any> {
    const studentSubmissions = await this.getSubmissions(assignmentId);
    const scores = studentSubmissions.map(s => parseFloat(s.grade || "0")).filter(s => s > 0);
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return {
      submissionCount: studentSubmissions.length,
      averageScore: avg.toFixed(2),
      allScores: scores
    };
  }

  async getNotificationPreferences(userId: string): Promise<any> {
    const [prefs] = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId));
    return prefs?.preferences;
  }

  async updateNotificationPreferences(userId: string, preferences: any): Promise<void> {
    await db.insert(notificationPreferences)
      .values({ userId, preferences })
      .onConflictDoUpdate({ target: notificationPreferences.userId, set: { preferences } });
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId));
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  async createNotification(notif: any): Promise<Notification> {
    // Only pass fields that exist in the notifications table schema
    const cleanNotif = {
      userId: notif.userId,
      type: notif.type,
      referenceId: notif.referenceId || notif.link || null,
      content: notif.content || notif.message || (notif.title ? `${notif.title}: ${notif.message || ''}` : 'Notification'),
      isRead: notif.isRead ?? false,
    };
    const [created] = await db.insert(notifications).values(cleanNotif).returning();
    return created;
  }

  async getUserSubmissionsForClass(classId: string, studentId: string): Promise<any[]> {
    const studentSubmissions = await db.select().from(submissions).where(eq(submissions.studentId, studentId));
    const classAssignments = await db.select().from(assignments).where(eq(assignments.classId, classId));
    const assignmentIds = new Set(classAssignments.map(a => a.id));

    return studentSubmissions.filter(s => assignmentIds.has(s.assignmentId));
  }

  async createParentInvitation(studentId: string, parentEmail: string, token: string, expiresAt: Date): Promise<any> {
    const [inv] = await db.insert(parentInvitations).values({ studentId, parentEmail, token, expiresAt }).returning();
    return inv;
  }

  async getParentInvitation(token: string): Promise<any> {
    const [inv] = await db.select().from(parentInvitations).where(eq(parentInvitations.token, token));
    return inv;
  }

  async updateParentInvitationStatus(id: string, status: string): Promise<void> {
    await db.update(parentInvitations).set({ status }).where(eq(parentInvitations.id, id));
  }

  async updateResourceAI(resourceId: string, summary: string, tags: string[]): Promise<void> {
    await db.update(resources).set({ summary, tags }).where(eq(resources.id, resourceId));
  }

  async updateSentiment(type: 'post' | 'comment', id: string, sentiment: string, score: number): Promise<void> {
    if (type === 'post') {
      await db.update(posts).set({ sentiment, sentimentScore: String(score) }).where(eq(posts.id, id));
    } else {
      await db.update(comments).set({ sentiment, sentimentScore: String(score) }).where(eq(comments.id, id));
    }
  }

  async getClassSentiment(classId: string): Promise<any> {
    const postSentiments = await db.select({ sentiment: posts.sentiment, score: posts.sentimentScore }).from(posts).where(eq(posts.classId, classId));
    return postSentiments;
  }


  async getAtRiskStudents(classId: string): Promise<any[]> {
    return await db.select().from(studentRisk).where(eq(studentRisk.classId, classId)).orderBy(desc(studentRisk.riskScore));
  }

  async flagReview(reviewId: string, isFlagged: boolean, moderatedBy: string): Promise<void> {
    await db.update(reviews).set({ isFlagged, moderatedBy }).where(eq(reviews.id, reviewId));
  }
  async getResourceRecommendations(resourceId: string): Promise<any[]> {
    const recs = await db.select()
      .from(resourceRecommendations)
      .where(eq(resourceRecommendations.resourceId, resourceId))
      .orderBy(desc(resourceRecommendations.score))
      .limit(3);

    const result = [];
    for (const rec of recs) {
      const [res] = await db.select().from(resources).where(eq(resources.id, rec.recommendedResourceId));
      if (res) result.push({ ...res, reason: rec.reason });
    }
    return result;
  }

  async generateRecommendations(resourceId: string): Promise<void> {
    // Basic logic: recommend other resources in the same topic
    const [current] = await db.select().from(resources).where(eq(resources.id, resourceId));
    if (!current) return;

    const topicResources = await db.select().from(resources).where(
      and(eq(resources.topicId, current.topicId), sql`${resources.id} != ${resourceId}`)
    );

    for (const rec of topicResources) {
      await db.insert(resourceRecommendations).values({
        resourceId,
        recommendedResourceId: rec.id,
        score: "0.80",
        reason: "Related to the same topic"
      }).onConflictDoNothing();
    }
  }
  // Phase 4: Intelligent Classroom Companion
  async insertDocumentChunks(chunks: { resourceId: string, chunkIndex: number, content: string, embedding?: number[] }[]): Promise<void> {
    const { documentChunks } = await import('@shared/schema');
    if (chunks.length === 0) return;
    await db.insert(documentChunks).values(chunks);
  }

  async searchDocumentChunks(queryEmbedding: number[], limit: number = 5): Promise<any[]> {
    const { documentChunks } = await import('@shared/schema');
    // Compute cosine distance using standard array math since we fell back to JSONB
    // In a pure pgvector setup, we'd use: order_by: sql`${documentChunks.embedding} <=> ${JSON.stringify(queryEmbedding)}`

    // We will retrieve all and calculate JS-side for the MVP fallback.
    const allChunks = await db.select().from(documentChunks);

    const cosineSimilarity = (a: number[], b: number[]) => {
      let dotProduct = 0;
      let normA = 0;
      let normB = 0;
      for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
      }
      return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    };

    const scored = allChunks.map(chunk => {
      let score = 0;
      if (chunk.embedding && Array.isArray(chunk.embedding)) {
        try {
          score = cosineSimilarity(queryEmbedding, chunk.embedding as number[]);
        } catch (e) { }
      }
      return { ...chunk, score };
    });

    return scored.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  async saveBotConversation(userId: string, classId: string, question: string, answer: string, sources?: any): Promise<void> {
    const { botConversations } = await import('@shared/schema');
    await db.insert(botConversations).values({ userId, classId, question, answer, sources });
  }

  async getBotConversations(classId: string, userId?: string): Promise<any[]> {
    const { botConversations } = await import('@shared/schema');
    let q = db.select().from(botConversations).where(eq(botConversations.classId, classId));
    if (userId) {
      q = db.select().from(botConversations).where(and(eq(botConversations.classId, classId), eq(botConversations.userId, userId)));
    }
    return await q.orderBy(desc(botConversations.createdAt));
  }

  async createSkill(skillData: any): Promise<any> {
    const { skills } = await import('@shared/schema');
    const [skill] = await db.insert(skills).values(skillData).returning();
    return skill;
  }

  async updateStudentSkill(studentId: string, skillId: string, points: number): Promise<void> {
    const { studentSkills } = await import('@shared/schema');
    const existing = await db.select().from(studentSkills).where(and(eq(studentSkills.studentId, studentId), eq(studentSkills.skillId, skillId)));

    if (existing.length > 0) {
      const newLevel = Math.min(100, Math.max(0, (existing[0].masteryLevel || 0) + points));
      await db.update(studentSkills)
        .set({ masteryLevel: newLevel, lastUpdated: new Date() })
        .where(and(eq(studentSkills.studentId, studentId), eq(studentSkills.skillId, skillId)));
    } else {
      const initLevel = Math.min(100, Math.max(0, points));
      await db.insert(studentSkills).values({ studentId, skillId, masteryLevel: initLevel });
    }
  }

  async getStudentSkills(studentId: string): Promise<any[]> {
    const { studentSkills, skills } = await import('@shared/schema');
    const records = await db.select().from(studentSkills).where(eq(studentSkills.studentId, studentId));

    const result = [];
    for (const r of records) {
      const [skillInfo] = await db.select().from(skills).where(eq(skills.id, r.skillId));
      if (skillInfo) result.push({ ...r, skill: skillInfo });
    }
    return result;
  }

  async generateLearningPath(studentId: string, classId: string): Promise<any[]> {
    const { learningPathItems } = await import('@shared/schema');
    // Ensure we return the existing active path if it exists
    const existingPath = await db.select().from(learningPathItems).where(
      and(eq(learningPathItems.studentId, studentId), eq(learningPathItems.classId, classId))
    ).orderBy(learningPathItems.position);

    if (existingPath.length > 0) {
      return existingPath;
    }

    // Fallback simple path generation using class resources/assignments if no complex heuristic logic exists yet
    const classResources = await db.select().from(resources);

    let position = 1;
    for (const res of classResources) {
      await db.insert(learningPathItems).values({
        studentId,
        classId,
        resourceId: res.id,
        position: position++
      });
    }

    return db.select().from(learningPathItems).where(
      and(eq(learningPathItems.studentId, studentId), eq(learningPathItems.classId, classId))
    ).orderBy(learningPathItems.position);
  }

  async completeLearningPathItem(itemId: string): Promise<void> {
    const { learningPathItems } = await import('@shared/schema');
    await db.update(learningPathItems).set({ status: 'completed' }).where(eq(learningPathItems.id, itemId));
  }

  // Phase 5: Emotional Intelligence
  async createWellbeingCheckin(checkinData: any): Promise<any> {
    const { wellbeingCheckins } = await import('@shared/schema');
    const [checkin] = await db.insert(wellbeingCheckins).values(checkinData).returning();
    return checkin;
  }

  async getWellbeingAnalytics(classId: string): Promise<any[]> {
    const { wellbeingCheckins } = await import('@shared/schema');
    return db.select()
      .from(wellbeingCheckins)
      .where(eq(wellbeingCheckins.isFlagged, true))
      .orderBy(desc(wellbeingCheckins.createdAt));
  }

  // v2 Ecosystem: Guilds
  async createGuild(guild: any): Promise<Guild> {
    const [newGuild] = await db.insert(guilds).values(guild).returning();
    // Create default general channel
    await db.insert(guildChannels).values({
      guildId: newGuild.id,
      name: "general",
      type: "text",
      topic: "General discussion"
    });
    return newGuild;
  }

  async getGuilds(classId?: string): Promise<Guild[]> {
    if (classId) {
      return db.select().from(guilds).where(eq(guilds.classId, classId));
    }
    return db.select().from(guilds);
  }

  async getGuildChannels(guildId: string): Promise<any[]> {
    return db.select().from(guildChannels).where(eq(guildChannels.guildId, guildId)).orderBy(guildChannels.position);
  }

  async joinGuild(guildId: string, userId: string, role: string = "member"): Promise<void> {
    await db.insert(guildMembers).values({ guildId, userId, role }).onConflictDoNothing();
  }

  // v2 Ecosystem: Forums
  async createForumPost(post: any): Promise<ForumPost> {
    const [newPost] = await db.insert(forumPosts).values(post).returning();
    return newPost;
  }

  async getForumPosts(communityId?: string): Promise<any[]> {
    let query = db.select({
      post: forumPosts,
      author: users,
    })
      .from(forumPosts)
      .innerJoin(users, eq(users.id, forumPosts.authorId));

    if (communityId) {
      query = query.where(eq(forumPosts.communityId, communityId)) as any;
    }

    return query.orderBy(desc(forumPosts.createdAt));
  }

  async getForumComments(postId: string): Promise<any[]> {
    return db.select({
      comment: forumComments,
      author: users,
    })
      .from(forumComments)
      .innerJoin(users, eq(users.id, forumComments.authorId))
      .where(eq(forumComments.postId, postId))
      .orderBy(forumComments.createdAt);
  }

  async voteForumPost(postId: string, userId: string, direction: 'up' | 'down'): Promise<void> {
    const increment = direction === 'up' ? 1 : -1;
    const field = direction === 'up' ? forumPosts.upvotes : forumPosts.downvotes;

    await db.update(forumPosts)
      .set({
        [direction === 'up' ? 'upvotes' : 'downvotes']: sql`${field} + 1`
      })
      .where(eq(forumPosts.id, postId));
  }

  // v2 Ecosystem: Career Launchpad
  async getCareerPaths(category?: string): Promise<CareerPath[]> {
    if (category) {
      return db.select().from(careerPaths).where(eq(careerPaths.category, category));
    }
    return db.select().from(careerPaths);
  }

  async enrollInCareerPath(studentId: string, pathId: string): Promise<void> {
    await db.insert(studentCareerProgress).values({ studentId, pathId, status: 'enrolled' }).onConflictDoNothing();
  }

  async getStudentCareerProgress(studentId: string): Promise<any[]> {
    return db.select({
      progress: studentCareerProgress,
      path: careerPaths,
    })
      .from(studentCareerProgress)
      .innerJoin(careerPaths, eq(careerPaths.id, studentCareerProgress.pathId))
      .where(eq(studentCareerProgress.studentId, studentId));
  }

  // ========== Admin Dashboard Methods ==========

  async getAdminStats(): Promise<any> {
    const [userCount] = await db.select({ count: count() }).from(users);
    const [teacherCount] = await db.select({ count: count() }).from(users).where(eq(users.role, 'teacher'));
    const [studentCount] = await db.select({ count: count() }).from(users).where(eq(users.role, 'student'));
    const [parentCount] = await db.select({ count: count() }).from(users).where(eq(users.role, 'parent'));
    const [classCount] = await db.select({ count: count() }).from(classes);
    const [postCount] = await db.select({ count: count() }).from(posts);
    const [assignmentCount] = await db.select({ count: count() }).from(assignments);
    const [submissionCount] = await db.select({ count: count() }).from(submissions);
    const [enrollmentCount] = await db.select({ count: count() }).from(enrollments);

    return {
      totalUsers: userCount.count,
      totalTeachers: teacherCount.count,
      totalStudents: studentCount.count,
      totalParents: parentCount.count,
      totalClasses: classCount.count,
      totalPosts: postCount.count,
      totalAssignments: assignmentCount.count,
      totalSubmissions: submissionCount.count,
      totalEnrollments: enrollmentCount.count,
    };
  }

  async getAllUsers(roleFilter?: string, search?: string): Promise<any[]> {
    let query = db.select().from(users);
    if (roleFilter && roleFilter !== 'all') {
      query = db.select().from(users).where(eq(users.role, roleFilter)) as any;
    }
    const allUsers = await query.orderBy(desc(users.createdAt));
    if (search) {
      const s = search.toLowerCase();
      return allUsers.filter((u: any) =>
        u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)
      );
    }
    return allUsers;
  }

  async updateUserRole(userId: string, role: string): Promise<any> {
    const [updated] = await db.update(users).set({ role }).where(eq(users.id, userId)).returning();
    return updated;
  }

  async deleteUser(userId: string): Promise<void> {
    // Delete enrollments, then the user
    await db.delete(enrollments).where(eq(enrollments.studentId, userId));
    await db.delete(notifications).where(eq(notifications.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
  }

  async getAllClassesAdmin(): Promise<any[]> {
    const allClasses = await db.select().from(classes).orderBy(desc(classes.createdAt));
    const result = [];
    for (const cls of allClasses) {
      const [teacher] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, cls.teacherId));
      const [enrolled] = await db.select({ count: count() }).from(enrollments).where(eq(enrollments.classId, cls.id));
      result.push({
        ...cls,
        teacherName: teacher?.name || 'Unknown',
        teacherEmail: teacher?.email || '',
        studentCount: enrolled.count,
      });
    }
    return result;
  }

  async deleteClass(classId: string): Promise<void> {
    await db.delete(enrollments).where(eq(enrollments.classId, classId));
    await db.delete(posts).where(eq(posts.classId, classId));
    await db.delete(assignments).where(eq(assignments.classId, classId));
    await db.delete(classes).where(eq(classes.id, classId));
  }

  async getRecentActivity(limit: number = 50): Promise<any[]> {
    const activities = await db.select().from(userActivities).orderBy(desc(userActivities.createdAt)).limit(limit);
    const result = [];
    for (const act of activities) {
      const [user] = await db.select({ name: users.name, email: users.email, role: users.role }).from(users).where(eq(users.id, act.userId));
      result.push({
        ...act,
        userName: user?.name || 'Unknown',
        userEmail: user?.email || '',
        userRole: user?.role || '',
      });
    }
    return result;
  }

  async getAllFlaggedWellbeing(): Promise<any[]> {
    const { wellbeingCheckins } = await import('@shared/schema');
    const flagged = await db.select().from(wellbeingCheckins).where(eq(wellbeingCheckins.isFlagged, true)).orderBy(desc(wellbeingCheckins.createdAt));
    const result = [];
    for (const entry of flagged) {
      const [student] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, entry.studentId));
      const [cls] = await db.select({ name: classes.name }).from(classes).where(eq(classes.id, entry.classId));
      result.push({
        ...entry,
        studentName: student?.name || 'Unknown',
        studentEmail: student?.email || '',
        className: cls?.name || 'Unknown',
      });
    }
    return result;
  }
}
export const storage = new DatabaseStorage();
