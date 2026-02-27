import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth } from "./auth";
import crypto from "crypto";
import { notificationService } from "./notification-service";
import { AIService } from "./services/aiService";
import { DocumentProcessor } from "./services/documentProcessor";
import { multerUpload, getUploadedFileUrl, getPresignedUploadUrl } from "./services/fileUploadService";
import path from "path";
import express from "express";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  // Serve locally-uploaded files (used when S3 is not configured)
  app.use("/uploads", express.static(path.resolve("uploads")));

  // ── File upload endpoint ────────────────────────────────────────────────────
  // POST /api/upload          — multipart upload via server (S3 stream or local)
  // POST /api/upload/presign  — get a presigned S3 URL for direct browser upload
  // Field name: "file", max 50 MB

  app.post("/api/upload", multerUpload.single("file"), async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    if (!req.file) return res.status(400).json({ message: "No file provided. Use field name 'file'." });
    try {
      const url = getUploadedFileUrl(req.file as any);
      res.json({ url });
    } catch (err: any) {
      console.error("[Upload] Error:", err.message);
      res.status(500).json({ message: "File upload failed", error: err.message });
    }
  });

  app.post("/api/upload/presign", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const { filename, mimeType } = req.body;
    if (!filename || !mimeType) return res.status(400).json({ message: "filename and mimeType are required" });
    const result = await getPresignedUploadUrl(filename, mimeType);
    if (!result) {
      return res.status(503).json({ message: "S3 not configured. Use /api/upload for server-side uploads." });
    }
    res.json(result); // { uploadUrl, fileUrl }
  });
  // ───────────────────────────────────────────────────────────────────────────

  // Phase 6: In-memory rate limiter for AI routes (20 req/min per user)
  // Falls back gracefully without Redis — uses a simple sliding window map
  const aiRateLimitMap = new Map<string, number[]>();
  const AI_RATE_LIMIT = 20;
  const AI_RATE_WINDOW_MS = 60_000;

  app.use("/api/ai", (req, res, next) => {
    if (!req.isAuthenticated()) return next(); // auth middleware handles 401
    const userId = (req.user as any).id;
    const now = Date.now();
    const windowStart = now - AI_RATE_WINDOW_MS;
    const timestamps = (aiRateLimitMap.get(userId) || []).filter(t => t > windowStart);
    if (timestamps.length >= AI_RATE_LIMIT) {
      return res.status(429).json({ message: "Too many AI requests. Please wait a moment before trying again." });
    }
    timestamps.push(now);
    aiRateLimitMap.set(userId, timestamps);
    next();
  });

  app.get("/api/setup-vector", async (req, res) => {
    try {
      const { sql } = await import("drizzle-orm");
      const { db } = await import("./db");
      await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`);
      res.json({ message: "Vector extension enabled successfully" });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to enable vector extension" });
    }
  });

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
      await storage.logActivity(user.id, cls.id, 'enrolled');
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

  app.get(api.classes.mySubmissions.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    const subs = await storage.getUserSubmissionsForClass(req.params.classId, user.id);
    res.json(subs);
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

      const sentimentData = await AIService.analyzeSentiment(input.content);
      const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : undefined;

      const post = await storage.createPost({
        ...input,
        classId: req.params.classId,
        authorId: user.id,
        scheduledAt,
        sentiment: sentimentData.sentiment,
        sentimentScore: sentimentData.score.toString()
      });

      if (input.poll) {
        await storage.createPoll(post.id, input.poll.question, input.poll.options);
      }

      await storage.logActivity(user.id, req.params.classId, 'created_post', post.id);

      // Only notify if not scheduled for the future
      if (!scheduledAt || scheduledAt <= new Date()) {
        await notificationService.notifyClass(req.params.classId, 'announcement', `New post in ${req.params.classId}`, input.content, `/class/${req.params.classId}`);
      }
      res.status(201).json(post);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.post(api.posts.translate.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const { targetLanguage } = api.posts.translate.input.parse(req.body);
      const post = await storage.getPost(req.params.postId);
      if (!post) return res.status(404).json({ message: "Post not found" });

      // Mock translation since we don't have Google Cloud credentials configured yet
      const translatedText = `[Translated to ${targetLanguage}]: ${post.content}`;
      res.json({ translatedText });
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

      const sentimentData = await AIService.analyzeSentiment(input.content);

      const comment = await storage.createComment({
        ...input,
        postId: req.params.postId,
        authorId: user.id,
        sentiment: sentimentData.sentiment,
        sentimentScore: sentimentData.score.toString()
      });
      // Fetch post to get classId for logging
      const parentPost = await storage.getPost(req.params.postId);
      if (parentPost) {
        await storage.logActivity(user.id, parentPost.classId, 'created_comment', comment.id);
      }
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

  // Resources
  app.get(api.resources.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const resources = await storage.getResources(req.params.topicId);
    res.json(resources);
  });

  app.get("/api/resources/:resourceId/recommendations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const recs = await storage.getResourceRecommendations(req.params.resourceId);
    res.json(recs);
  });

  app.post(api.resources.create.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'teacher') return res.sendStatus(403);
    try {
      const input = api.resources.create.input.parse(req.body);
      const resource = await storage.createResource({ ...input, topicId: req.params.topicId });
      // Trigger recommendation generation in background
      storage.generateRecommendations(resource.id).catch(console.error);

      // Hook into Phase 4: Bot RAG Pipeline
      DocumentProcessor.processResource(
        resource.id,
        resource.title || 'Untitled',
        resource.summary || '',
        resource.fileUrl
      ).catch(console.error);

      res.status(201).json(resource);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.patch("/api/resources/:id/version", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'teacher') return res.sendStatus(403);
    try {
      const { fileUrl, fileType } = req.body;
      if (!fileUrl) return res.status(400).send("New fileUrl is required");
      const updated = await storage.updateResourceVersion(req.params.id, fileUrl, fileType);

      // Re-trigger chunk extraction for the updated resource file version
      DocumentProcessor.processResource(
        updated.id,
        updated.title || 'Untitled',
        updated.summary || '',
        updated.fileUrl
      ).catch(console.error);

      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  // AI Content Assistance
  app.post(api.ai.summarize.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { resourceId, text } = req.body;
    let content = text;

    if (resourceId) {
      const resource = await storage.getResource(resourceId);
      if (resource && resource.type === 'file') {
        // Here we would extract text from file
        // For now, if no text provided, we'll try to use resource content if it was stored
      }
    }

    if (!content) return res.status(400).send("No content to summarize");
    const summary = await AIService.summarize(content);
    res.json({ summary });
  });

  app.post(api.ai.suggestTags.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { text } = req.body;
    if (!text) return res.status(400).send("No content for tagging");
    const tags = await AIService.suggestTags(text);
    res.json(tags);
  });

  app.post(api.ai.generateQuiz.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'teacher') return res.sendStatus(403);
    const { text } = req.body;
    if (!text) return res.status(400).send("No content for quiz generation");
    const quiz = await AIService.generateQuiz(text);
    res.json(quiz);
  });

  app.post(api.ai.lessonPlan.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'teacher') return res.sendStatus(403);
    const { topic, grade, duration, objectives } = req.body;
    const plan = await AIService.generateLessonPlan(topic, grade, duration, objectives);
    res.json({ plan });
  });

  // Phase 4: Bot Conversations & RAG
  app.post("/api/ai/bot/ask", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const { question, classId } = req.body;
    if (!question || !classId) return res.status(400).send("Question and classId required");

    try {
      // 1. Convert question to vector
      const embedVector = await AIService.embedText(question);

      // 2. Perform semantic search against existing chunks
      let contextChunks: string[] = [];
      let sources: string[] = [];
      if (embedVector) {
        const matches = await storage.searchDocumentChunks(embedVector, 3);
        contextChunks = matches.map(m => m.content);
        sources = matches.map(m => m.resourceId);
      }

      // 3. Get conversation history to provide memory
      const historyItems = await storage.getBotConversations(classId, user.id);
      const history = historyItems.reverse().map(item => [
        { role: 'user', parts: [{ text: item.question }] },
        { role: 'model', parts: [{ text: item.answer }] }
      ]).flat();

      // 4. Hit Gemini Chat
      const answer = await AIService.chatWithContext(question, contextChunks, history);

      // 5. Store conversation
      await storage.saveBotConversation(user.id, classId, question, answer, Array.from(new Set(sources)));

      res.json({ answer, sources: Array.from(new Set(sources)) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to process chat query" });
    }
  });

  app.get("/api/ai/bot/history/:classId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    try {
      const history = await storage.getBotConversations(req.params.classId, user.id);
      res.json(history);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch history" });
    }
  });

  // Phase 4: Personalized Learning Paths
  app.get("/api/learning-paths/:classId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    try {
      const path = await storage.generateLearningPath(user.id, req.params.classId);
      res.json(path);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch learning path" });
    }
  });

  app.post("/api/learning-paths/:classId/generate", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    try {
      // Force regeneration by hitting the generator logic (for MVP, we just fetch existing)
      const path = await storage.generateLearningPath(user.id, req.params.classId);
      res.json(path);
    } catch (err) {
      res.status(500).json({ message: "Failed to generate learning path" });
    }
  });

  app.post("/api/learning-paths/items/:itemId/complete", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      await storage.completeLearningPathItem(req.params.itemId);
      res.sendStatus(200);
    } catch (err) {
      res.status(500).json({ message: "Failed to complete item" });
    }
  });

  // Phase 5: Wellbeing Check-ins
  app.post("/api/wellbeing/checkin", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const { classId, moodScore, notes } = req.body;
    if (!classId || moodScore == null) return res.status(400).json({ message: "classId and moodScore are required" });
    try {
      // Run AI sentiment analysis on any notes provided
      let aiSentimentScore: number | undefined;
      let isFlagged = false;
      if (notes) {
        const sentiment = await AIService.analyzeSentiment(notes);
        // AIService returns score 0-1; convert to 0-100 for storage
        aiSentimentScore = Math.round((sentiment?.score ?? 0.5) * 100);
        isFlagged = aiSentimentScore < 25; // Flag if very negative
      }
      // Also flag if mood score is critically low
      if (moodScore === 1) isFlagged = true;

      const checkin = await storage.createWellbeingCheckin({
        studentId: user.id, classId, moodScore, notes, aiSentimentScore, isFlagged
      });

      // Notify teacher if student is flagged
      if (isFlagged) {
        const cls = await storage.getClass(classId);
        if (cls) {
          await storage.createNotification({
            userId: cls.teacherId,
            type: 'wellbeing_alert',
            title: 'Student Well-being Alert',
            message: `A student may need support in ${cls.name}. Review the well-being dashboard.`,
            link: `/class/${classId}`,
            isRead: false,
          });
        }
      }
      res.status(201).json(checkin);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to save check-in" });
    }
  });

  app.get("/api/wellbeing/analytics/:classId", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== 'teacher') return res.sendStatus(403);
    try {
      const checkins = await storage.getWellbeingAnalytics(req.params.classId);
      // Aggregate: average mood per day, flagged entries
      const flagged = checkins.filter((c: any) => c.isFlagged);
      const moodByDay: Record<string, number[]> = {};
      checkins.forEach((c: any) => {
        const day = new Date(c.createdAt).toISOString().split('T')[0];
        if (!moodByDay[day]) moodByDay[day] = [];
        moodByDay[day].push(c.moodScore);
      });
      const trends = Object.entries(moodByDay).map(([date, scores]) => ({
        date,
        avgMood: parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)),
        count: scores.length,
      }));
      res.json({ trends, flagged, totalCheckins: checkins.length });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.post("/api/classes/:classId/analytics/risk-assessment", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'teacher') return res.sendStatus(403);
    const { RiskService } = await import("./services/riskService");
    await RiskService.runClassRiskAssessment(req.params.classId);
    res.json({ message: "Risk assessment completed" });
  });

  app.get("/api/classes/:classId/analytics/at-risk", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'teacher') return res.sendStatus(403);
    const students = await storage.getAtRiskStudents(req.params.classId);
    res.json(students);
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
      const assignment = await storage.createAssignment({
        ...input,
        classId: req.params.classId,
        createdBy: user.id,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        reviewDeadline: input.reviewDeadline ? new Date(input.reviewDeadline) : undefined
      });

      if (input.prerequisites && input.prerequisites.length > 0) {
        for (const preId of input.prerequisites) {
          await storage.addPrerequisite(preId, 'assignment', assignment.id, 'assignment');
        }
      }
      await storage.logActivity(user.id, req.params.classId, 'created_assignment', assignment.id);
      await notificationService.notifyClass(req.params.classId, 'assignment_created', 'New Assignment', `${assignment.title} has been posted.`, `/class/${req.params.classId}`);
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
      await notificationService.notify(sub.studentId, 'grade_published', 'Work Graded', `Your submission has been graded: ${grade}`, `/class/${sub.assignmentId}`);
      res.json(sub);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.get("/api/assignments/:id/reviews", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'teacher') return res.sendStatus(403);
    const revs = await storage.getReviewsForAssignment(req.params.id);
    res.json(revs);
  });

  app.patch("/api/reviews/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'teacher') return res.sendStatus(403);
    try {
      const { score, isFlagged } = req.body;
      const updated = await storage.updateReviewModeration(req.params.id, score, isFlagged, req.user.id);
      res.json(updated);
    } catch (err) {
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

  app.get(api.notifications.preferences.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    const prefs = await storage.getNotificationPreferences(user.id);
    res.json(prefs || {});
  });

  app.patch(api.notifications.preferences.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    try {
      await storage.updateNotificationPreferences(user.id, req.body);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Error updating preferences" });
    }
  });

  // Phase 2: Parents
  app.get(api.parents.children.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    if (user.role !== 'parent') return res.status(403).json({ message: "Only parents can view this" });
    const children = await storage.getLinkedChildren(user.id);
    res.json(children);
  });

  app.get(api.parents.dashboard.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    if (user.role !== 'parent') return res.status(403).json({ message: "Forbidden" });
    const dashboard = await storage.getChildDashboard(req.params.studentId);
    res.json(dashboard);
  });

  // Phase 2: Messaging
  app.get(api.messaging.conversations.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    const conversations = await storage.getConversations(user.id);
    res.json(conversations);
  });

  app.post(api.messaging.conversations.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    try {
      const { type, name, participants } = api.messaging.conversations.create.input.parse(req.body);
      const conv = await storage.createConversation(type, name);
      await storage.addParticipant(conv.id, user.id);
      for (const p of participants) {
        await storage.addParticipant(conv.id, p);
      }
      res.status(201).json(conv);
    } catch (err) {
      res.status(500).json({ message: "Error creating conversation" });
    }
  });

  app.get(api.messaging.messages.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const messages = await storage.getMessages(req.params.conversationId);
    res.json(messages);
  });

  app.post(api.messaging.messages.send.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    const { content } = api.messaging.messages.send.input.parse(req.body);
    const msg = await storage.sendMessage(req.params.conversationId, user.id, content);
    res.status(201).json(msg);
  });

  // Phase 2: Polls
  app.get(api.polls.get.path, async (req, res) => {
    const poll = await storage.getPoll(req.params.postId);
    res.json(poll);
  });

  app.post(api.polls.vote.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    const { optionId } = api.polls.vote.input.parse(req.body);
    await storage.voteInPoll(req.params.pollId, optionId, user.id);
    // Logging vote activity
    const poll = await storage.getPollById(req.params.pollId);
    if (poll) {
      const parentPost = await storage.getPost(poll.postId);
      if (parentPost) {
        await storage.logActivity(user.id, parentPost.classId, 'voted_poll', poll.id);
      }
    }
    res.json({ success: true });
  });

  // Phase 2: Analytics
  app.get(api.analytics.engagement.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'teacher') return res.sendStatus(403);
    const heatmap = await storage.getEngagementHeatmap(req.params.classId);
    res.json(heatmap);
  });

  app.get(api.analytics.assignment.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'teacher') return res.sendStatus(403);
    const stats = await storage.getAssignmentStats(req.params.assignmentId);
    res.json(stats);
  });

  // Phase 3: Parent Invitation Routes
  app.post(api.parents.invite.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'teacher') return res.sendStatus(403);
    const { studentId, parentEmail } = req.body;

    const student = await storage.getUser(studentId);
    if (!student) return res.status(404).send("Student not found");

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await storage.createParentInvitation(studentId, parentEmail, token, expiresAt);
    await notificationService.sendInvitationEmail(parentEmail, student.name, token);

    res.json({ message: "Invitation sent successfully" });
  });

  app.get(api.parents.getInvitation.path, async (req, res) => {
    const invitation = await storage.getParentInvitation(req.params.token);
    if (!invitation || invitation.status !== 'pending' || invitation.expiresAt < new Date()) {
      return res.status(404).send("Invalid or expired invitation");
    }
    const student = await storage.getUser(invitation.studentId);
    res.json({ invitation, student });
  });

  app.post(api.parents.linkStudent.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'parent') return res.sendStatus(403);
    const { token } = req.body;

    const invitation = await storage.getParentInvitation(token);
    if (!invitation || invitation.status !== 'pending' || invitation.expiresAt < new Date()) {
      return res.status(400).send("Invalid or expired invitation");
    }

    await storage.linkParentToStudent(req.user.id, invitation.studentId);
    await storage.updateParentInvitationStatus(invitation.id, 'accepted');

    res.json({ message: "Student linked successfully" });
  });

  // ========== Super Admin Setup ==========
  // One-time endpoint to promote the current user to super_admin
  // This is needed because there's no other way to create the first admin
  app.post("/api/admin/promote-self", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    try {
      const updated = await storage.updateUserRole(user.id, 'super_admin');
      res.json({ message: "You are now a super_admin!", user: updated });
    } catch (err) {
      res.status(500).json({ message: "Failed to promote user" });
    }
  });

  // ========== Super Admin Dashboard Routes ==========

  // Admin auth guard middleware
  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    if ((req.user as any).role !== 'super_admin') return res.status(403).json({ message: "Forbidden: Admin access required" });
    next();
  };

  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const role = req.query.role as string | undefined;
      const search = req.query.search as string | undefined;
      const users = await storage.getAllUsers(role, search);
      res.json(users);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id/role", requireAdmin, async (req, res) => {
    try {
      const { role } = req.body;
      if (!['student', 'teacher', 'parent', 'super_admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      const updated = await storage.updateUserRole(req.params.id, role);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const currentUser = req.user as any;
      if (currentUser.id === req.params.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      await storage.deleteUser(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.get("/api/admin/classes", requireAdmin, async (req, res) => {
    try {
      const classes = await storage.getAllClassesAdmin();
      res.json(classes);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  app.delete("/api/admin/classes/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteClass(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete class" });
    }
  });

  app.get("/api/admin/activity", requireAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const activity = await storage.getRecentActivity(limit);
      res.json(activity);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  app.get("/api/admin/wellbeing/flagged", requireAdmin, async (req, res) => {
    try {
      const flagged = await storage.getAllFlaggedWellbeing();
      res.json(flagged);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch flagged wellbeing entries" });
    }
  });

  // User search — for starting conversations in messaging
  app.get("/api/users/search", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const q = (req.query.q as string || "").toLowerCase().trim();
    if (!q || q.length < 2) return res.json([]);
    try {
      // Get all classes the current user belongs to, then find co-members
      const currentUser = req.user as any;
      const userClasses = await storage.getClassesForUser(currentUser.id, currentUser.role);
      const seenIds = new Set<string>([currentUser.id]);
      const results: any[] = [];

      for (const cls of userClasses) {
        const roster = await storage.getClassRoster(cls.id);
        for (const member of roster) {
          if (!seenIds.has(member.id) &&
            (member.name.toLowerCase().includes(q) || member.email.toLowerCase().includes(q))) {
            seenIds.add(member.id);
            results.push({ id: member.id, name: member.name, email: member.email, role: member.role });
          }
        }
      }
      res.json(results.slice(0, 10));
    } catch (err) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  return httpServer;
}
