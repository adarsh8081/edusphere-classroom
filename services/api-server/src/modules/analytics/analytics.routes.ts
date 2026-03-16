import { Router } from "express";
import { api } from "@edusphere/api-client";
import { requireTeacher } from "../../core/middleware/auth";
import { analyticsController } from "./analytics.controller";

const router = Router();

router.get(api.analytics.engagement.path, requireTeacher, analyticsController.getEngagementHeatmap);
router.get(api.analytics.assignment.path, requireTeacher, analyticsController.getAssignmentStats);

export default router;
