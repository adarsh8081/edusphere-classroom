import { Router } from "express";
import { api } from "@edusphere/api-client";
import { requireAuth } from "../../core/middleware/auth";
import { notificationsController } from "./notifications.controller";

const router = Router();

router.get(api.notifications.list.path, requireAuth, notificationsController.listNotifications);
router.patch(api.notifications.markRead.path, requireAuth, notificationsController.markRead);
router.get(api.notifications.preferences.path, requireAuth, notificationsController.getPreferences);
router.patch(api.notifications.preferences.path, requireAuth, notificationsController.updatePreferences);

export default router;
