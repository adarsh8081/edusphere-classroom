import { Router } from "express";
import { api } from "@edusphere/api-client";
import { requireAuth, requireTeacher } from "../../core/middleware/auth";
import { validateBody } from "../../core/middleware/validation";
import { wellbeingController } from "./wellbeing.controller";

const router = Router();

router.post("/api/wellbeing/checkin", requireAuth, wellbeingController.checkinLegacy);
router.get("/api/wellbeing/analytics/:classId", requireTeacher, wellbeingController.getAnalytics);

// Wellbeing checkin via API contract
router.post(api.wellbeing.checkin.path, requireAuth, validateBody(api.wellbeing.checkin.input), wellbeingController.checkin);
router.get(api.wellbeing.stats.path, requireAuth, wellbeingController.getStats);

// Risk assessment
router.post("/api/classes/:classId/analytics/risk-assessment", requireTeacher, wellbeingController.runRiskAssessment);
router.get("/api/classes/:classId/analytics/at-risk", requireTeacher, wellbeingController.getAtRiskStudents);

export default router;
