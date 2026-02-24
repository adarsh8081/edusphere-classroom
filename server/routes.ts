import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth } from "./auth";
import crypto from "crypto";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  app.get(api.classes.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    const classes = await storage.getClassesForUser(user.id, user.role);
    res.json(classes);
  });

  app.post(api.classes.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    if (user.role !== 'teacher' && user.role !== 'super_admin') {
      return res.status(403).json({ message: "Only teachers can create classes" });
    }
    try {
      const input = api.classes.create.input.parse(req.body);
      const classCode = crypto.randomBytes(3).toString("hex").toUpperCase();
      const newClass = await storage.createClass({ ...input, classCode, teacherId: user.id });
      res.status(201).json(newClass);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.classes.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const cls = await storage.getClass(req.params.classId);
    if (!cls) return res.status(404).json({ message: "Class not found" });
    res.json(cls);
  });

  app.post(api.classes.join.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    try {
      const { classCode } = api.classes.join.input.parse(req.body);
      const cls = await storage.getClassByCode(classCode);
      if (!cls) return res.status(404).json({ message: "Invalid class code" });
      await storage.enrollStudent(cls.id, user.id);
      res.status(201).json({ message: "Joined successfully" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.classes.roster.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const roster = await storage.getClassRoster(req.params.classId);
    res.json(roster);
  });

  // Posts
  app.get(api.posts.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const posts = await storage.getPosts(req.params.classId);
    res.json(posts);
  });

  app.post(api.posts.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    try {
      const input = api.posts.create.input.parse(req.body);
      const post = await storage.createPost({ ...input, classId: req.params.classId, authorId: user.id });
      res.status(201).json(post);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.post(api.comments.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    try {
      const input = api.comments.create.input.parse(req.body);
      const comment = await storage.createComment({ ...input, postId: req.params.postId, authorId: user.id });
      res.status(201).json(comment);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Topics
  app.get(api.topics.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const topics = await storage.getTopics(req.params.classId);
    res.json(topics);
  });

  app.post(api.topics.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const input = api.topics.create.input.parse(req.body);
      const topic = await storage.createTopic({ ...input, classId: req.params.classId });
      res.status(201).json(topic);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Assignments
  app.get(api.assignments.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const assignments = await storage.getAssignments(req.params.classId);
    res.json(assignments);
  });

  app.post(api.assignments.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    if (user.role !== 'teacher') return res.status(403).json({ message: "Forbidden" });
    try {
      const input = api.assignments.create.input.parse(req.body);
      const assignment = await storage.createAssignment({ ...input, classId: req.params.classId, createdBy: user.id });
      res.status(201).json(assignment);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.get(api.assignments.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const a = await storage.getAssignment(req.params.assignmentId);
    if (!a) return res.status(404).json({ message: "Not found" });
    res.json(a);
  });

  // Submissions
  app.get(api.submissions.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const subs = await storage.getSubmissions(req.params.assignmentId);
    res.json(subs);
  });

  app.post(api.submissions.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    try {
      const input = api.submissions.create.input.parse(req.body);
      const sub = await storage.createSubmission({ ...input, assignmentId: req.params.assignmentId, studentId: user.id });
      res.status(201).json(sub);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.patch(api.submissions.grade.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    if (user.role !== 'teacher') return res.status(403).json({ message: "Forbidden" });
    try {
      const { grade, feedback } = api.submissions.grade.input.parse(req.body);
      const sub = await storage.gradeSubmission(req.params.submissionId, String(grade), feedback);
      res.json(sub);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Attendance
  app.get(api.attendance.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const date = req.query.date as string;
    const att = await storage.getAttendance(req.params.classId, date);
    res.json(att);
  });

  app.post(api.attendance.mark.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    if (user.role !== 'teacher') return res.status(403).json({ message: "Forbidden" });
    try {
      const { date, records } = api.attendance.mark.input.parse(req.body);
      await storage.markAttendance(req.params.classId, date, records, user.id);
      res.status(201).json({ message: "Attendance marked" });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Notifications
  app.get(api.notifications.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    const notifs = await storage.getNotifications(user.id);
    res.json(notifs);
  });

  app.patch(api.notifications.markRead.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    await storage.markNotificationRead(req.params.id);
    res.json({ success: true });
  });

  return httpServer;
}
