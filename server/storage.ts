import { db } from "./db";
import { eq, and } from "drizzle-orm";
import {
  users, classes, enrollments, posts, comments, topics, resources, assignments, submissions, attendance, notifications,
  type User, type InsertUser, type Class, type InsertClass, type Post, type InsertPost, type Comment, type InsertComment,
  type Topic, type InsertTopic, type Resource, type InsertResource, type Assignment, type InsertAssignment,
  type Submission, type InsertSubmission, type Attendance, type Notification
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
  createUser(user: InsertUser): Promise<User>;
  
  createClass(cls: InsertClass & { classCode: string, teacherId: string }): Promise<Class>;
  getClass(id: string): Promise<Class | undefined>;
  getClassByCode(code: string): Promise<Class | undefined>;
  getClassesForUser(userId: string, role: string): Promise<Class[]>;
  enrollStudent(classId: string, studentId: string): Promise<void>;
  getClassRoster(classId: string): Promise<User[]>;

  createPost(post: InsertPost & { classId: string, authorId: string }): Promise<Post>;
  getPosts(classId: string): Promise<(Post & { author: User, comments: (Comment & { author: User })[] })[]>;

  createComment(comment: InsertComment & { authorId: string }): Promise<Comment>;

  createTopic(topic: InsertTopic & { classId: string }): Promise<Topic>;
  getTopics(classId: string): Promise<Topic[]>;

  createAssignment(assignment: InsertAssignment & { classId: string, createdBy: string }): Promise<Assignment>;
  getAssignments(classId: string): Promise<Assignment[]>;
  getAssignment(id: string): Promise<Assignment | undefined>;

  createSubmission(submission: InsertSubmission & { studentId: string }): Promise<Submission>;
  getSubmissions(assignmentId: string): Promise<(Submission & { student: User })[]>;
  gradeSubmission(submissionId: string, grade: string, feedback?: string): Promise<Submission>;

  markAttendance(classId: string, date: string, records: {studentId: string, status: string}[], markedBy: string): Promise<void>;
  getAttendance(classId: string, date?: string): Promise<Attendance[]>;

  getNotifications(userId: string): Promise<Notification[]>;
  markNotificationRead(id: string): Promise<void>;
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

  async createClass(cls: InsertClass & { classCode: string, teacherId: string }): Promise<Class> {
    const [created] = await db.insert(classes).values(cls).returning();
    return created;
  }

  async getClass(id: string): Promise<Class | undefined> {
    const [cls] = await db.select().from(classes).where(eq(classes.id, id));
    return cls;
  }

  async getClassByCode(code: string): Promise<Class | undefined> {
    const [cls] = await db.select().from(classes).where(eq(classes.classCode, code));
    return cls;
  }

  async getClassesForUser(userId: string, role: string): Promise<Class[]> {
    if (role === 'teacher') {
      return await db.select().from(classes).where(eq(classes.teacherId, userId));
    } else {
      const enrolled = await db.select().from(enrollments).where(eq(enrollments.studentId, userId));
      if (enrolled.length === 0) return [];
      
      const userClasses = [];
      for (const e of enrolled) {
        const [c] = await db.select().from(classes).where(eq(classes.id, e.classId));
        if (c) userClasses.push(c);
      }
      return userClasses;
    }
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

  async createPost(post: InsertPost & { classId: string, authorId: string }): Promise<Post> {
    const [created] = await db.insert(posts).values(post).returning();
    return created;
  }

  async getPosts(classId: string) {
    const classPosts = await db.select().from(posts).where(eq(posts.classId, classId));
    const result = [];
    for (const p of classPosts) {
      const [author] = await db.select().from(users).where(eq(users.id, p.authorId));
      const postComments = await db.select().from(comments).where(eq(comments.postId, p.id));
      const commentsWithAuthors = [];
      for (const c of postComments) {
        const [cAuthor] = await db.select().from(users).where(eq(users.id, c.authorId));
        commentsWithAuthors.push({ ...c, author: cAuthor });
      }
      result.push({ ...p, author, comments: commentsWithAuthors });
    }
    return result.sort((a,b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
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

  async createAssignment(assignment: InsertAssignment & { classId: string, createdBy: string }): Promise<Assignment> {
    const [created] = await db.insert(assignments).values({
      ...assignment,
      dueDate: assignment.dueDate ? new Date(assignment.dueDate) : null
    }).returning();
    return created;
  }

  async getAssignments(classId: string): Promise<Assignment[]> {
    return await db.select().from(assignments).where(eq(assignments.classId, classId));
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

  async markAttendance(classId: string, date: string, records: {studentId: string, status: string}[], markedBy: string): Promise<void> {
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

  async getNotifications(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId));
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }
}

export const storage = new DatabaseStorage();
