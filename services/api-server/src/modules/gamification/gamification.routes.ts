import { Router } from "express";
import { requireAuth, requireTeacher } from "../../core/middleware/auth";
import { gamificationController } from "./gamification.controller";

const router = Router();

// GET /api/gamification/me — current user's profile
router.get("/api/gamification/me", requireAuth, gamificationController.getMe);

// GET /api/gamification/leaderboard/:classId
router.get("/api/gamification/leaderboard/:classId", requireAuth, gamificationController.getLeaderboard);

// GET /api/gamification/badges
router.get("/api/gamification/badges", requireAuth, gamificationController.getBadges);

// POST /api/gamification/xp — manual XP award (teacher/admin)
router.post("/api/gamification/xp", requireTeacher, gamificationController.awardManualXp);

export default router;
