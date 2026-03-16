import { Router } from "express";
import { api } from "@edusphere/api-client";
import { requireAuth, requireTeacher } from "../../core/middleware/auth";
import { aiRateLimiter } from "../../core/middleware/rateLimiter";
import { aiController } from "./ai.controller";

const router = Router();

// Apply rate limiter to all AI routes
router.use("/api/ai", aiRateLimiter);

// ── AI Content Assistance ────────────────────────────────────────────────────
router.post(api.ai.summarize.path, requireAuth, aiController.summarize);
router.post(api.ai.suggestTags.path, requireAuth, aiController.suggestTags);
router.post(api.ai.generateQuiz.path, requireTeacher, aiController.generateQuiz);
router.post(api.ai.lessonPlan.path, requireTeacher, aiController.lessonPlan);

// ── Bot Conversations & RAG ──────────────────────────────────────────────────
router.post("/api/ai/bot/ask", requireAuth, aiController.botAsk);
router.get("/api/ai/bot/history/:classId", requireAuth, aiController.botHistory);

// ── Learning Paths ───────────────────────────────────────────────────────────
router.get("/api/learning-paths/:classId", requireAuth, aiController.getLearningPath);
router.post("/api/learning-paths/:classId/generate", requireAuth, aiController.generateLearningPath);
router.post("/api/learning-paths/items/:itemId/complete", requireAuth, aiController.completePathItem);

// ── Setup Vector Extension ───────────────────────────────────────────────────
router.get("/api/setup-vector", aiController.setupVector);

// ── AI Tutor Routes ──────────────────────────────────────────────────────────
router.get("/api/tutor/me/recommendations/:classId", requireAuth, aiController.getRecommendations);
router.get("/api/tutor/me/study-plan/:classId", requireAuth, aiController.getStudyPlan);
router.post("/api/tutor/analyze/:classId", requireAuth, aiController.analyzePerformance);
router.post("/api/tutor/explain", requireAuth, aiController.explainSimply);

export default router;
