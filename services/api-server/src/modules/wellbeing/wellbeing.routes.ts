import { Router } from "express";
import { api } from "@edusphere/api-client";
import { requireAuth, requireTeacher } from "../../core/middleware/auth";
import { validateBody } from "../../core/middleware/validation";
import { wellbeingController } from "./wellbeing.controller";
import { db } from "../../core/database/db";
import { classes } from "@edusphere/types";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/api/wellbeing/analytics/:classId", requireTeacher, wellbeingController.getAnalytics);

// Wellbeing checkin via API contract
router.post(api.wellbeing.checkin.path, requireAuth, validateBody(api.wellbeing.checkin.input), wellbeingController.checkin);

router.get(
  api.wellbeing.stats.path,
  requireTeacher,
  async (req, res, next) => {
    try {
      const classId = req.params.classId as string;
      const [cls] = await db.select().from(classes).where(eq(classes.id, classId));
      if (!cls || cls.teacherId !== (req.user as any).id) {
        return res.status(403).json({ message: "Forbidden: Not your class" });
      }
      next();
    } catch (err) {
      next(err);
    }
  },
  wellbeingController.getStats
);

// Risk assessment
router.post("/api/classes/:classId/analytics/risk-assessment", requireTeacher, wellbeingController.runRiskAssessment);
router.get("/api/classes/:classId/analytics/at-risk", requireTeacher, wellbeingController.getAtRiskStudents);

export default router;
