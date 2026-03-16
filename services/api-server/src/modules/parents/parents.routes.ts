import { Router } from "express";
import { requireAuth, requireTeacher } from "../../core/middleware/auth";
import { parentsController } from "./parents.controller";

const router = Router();

// ── Parent Invitations (Teacher-initiated) ───────────────────────────────────

router.post("/api/parents/invite", requireTeacher, parentsController.invite);

// ── Verify Invitation Token ──────────────────────────────────────────────────

router.get("/api/parents/invitation/:token", parentsController.verifyInvitation);

// ── Parent Registration ──────────────────────────────────────────────────────

router.post("/api/parents/register", parentsController.register);

// ── Parent Dashboard ─────────────────────────────────────────────────────────

router.get("/api/parents/dashboard", requireAuth, parentsController.dashboard);

// ── Parent Messages ──────────────────────────────────────────────────────────

router.post("/api/parents/messages", requireAuth, parentsController.sendMessages);
router.get("/api/parents/messages/:parentId/:teacherId/:studentId", requireAuth, parentsController.getMessages);

// ── API-contract parent routes ───────────────────────────────────────────────

router.get("/api/parents/children", requireAuth, parentsController.getChildren);
router.get("/api/parents/dashboard/:studentId", requireAuth, parentsController.getChildDashboard);
router.post("/api/parents/link", requireAuth, parentsController.link);

export default router;
