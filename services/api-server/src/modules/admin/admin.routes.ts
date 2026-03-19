import { Router } from "express";
import { requireAdmin } from "../../core/middleware/auth";
import { adminController } from "./admin.controller";

const router = Router();

// ── Admin User Management ────────────────────────────────────────────────────
router.post("/api/admin/users", requireAdmin, adminController.createUser);

router.post(
  "/api/admin/promote-self",
  (req, res, next) => {
    if (process.env.NODE_ENV === "production") {
      return res.status(404).json({ message: "Not Found" });
    }
    
    if (process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test") {
      return res.status(403).json({ error: "Backdoor only available in dev/test" });
    }

    const devSecret = req.headers["x-dev-secret"];
    if (!process.env.DEV_SECRET || !devSecret || devSecret !== process.env.DEV_SECRET) {
      return res.status(403).json({ error: "Forbidden: Invalid or missing developer secret" });
    }
    next();
  },
  adminController.promoteSelf
);

// ── Admin Dashboard ──────────────────────────────────────────────────────────
router.get("/api/admin/stats", requireAdmin, adminController.getStats);
router.get("/api/admin/users", requireAdmin, adminController.getUsers);
router.patch("/api/admin/users/:id/role", requireAdmin, adminController.updateUserRole);
router.delete("/api/admin/users/:id", requireAdmin, adminController.deleteUser);

router.get("/api/admin/classes", requireAdmin, adminController.getClasses);
router.delete("/api/admin/classes/:id", requireAdmin, adminController.deleteClass);

router.get("/api/admin/activity", requireAdmin, adminController.getActivity);
router.get("/api/admin/wellbeing/flagged", requireAdmin, adminController.getFlaggedWellbeing);

router.get("/api/admin/institutional-stats", requireAdmin, adminController.getInstitutionalStats);
router.post("/api/admin/trigger-weekly-digest", adminController.triggerWeeklyDigest);

export default router;
