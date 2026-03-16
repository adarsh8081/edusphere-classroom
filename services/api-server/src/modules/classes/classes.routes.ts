import { Router } from "express";
import { classesController } from "./classes.controller";
import { api } from "@edusphere/api-client";
import { requireAuth, requireTeacher } from "../../core/middleware/auth";
import { validateBody } from "../../core/middleware/validation";

const router = Router();

// GET /api/classes — list classes for current user
router.get(api.classes.list.path, requireAuth, classesController.list);

// POST /api/classes — create a new class
router.post(api.classes.create.path, requireTeacher, validateBody(api.classes.create.input), classesController.create);

// GET /api/classes/:classId — get class details
router.get(api.classes.get.path, requireAuth, classesController.get);

// POST /api/classes/join — join a class by code
router.post(api.classes.join.path, requireAuth, validateBody(api.classes.join.input), classesController.join);

// GET /api/classes/:classId/roster — class roster
router.get(api.classes.roster.path, requireAuth, classesController.roster);

// GET /api/classes/:classId/submissions — user submissions for class
router.get(api.classes.mySubmissions.path, requireAuth, classesController.mySubmissions);

// PATCH /api/classes/:classId — update an existing class
router.patch(api.classes.update.path, requireTeacher, validateBody(api.classes.update.input), classesController.update);

// DELETE /api/classes/:classId — delete a class
router.delete(api.classes.delete.path, requireTeacher, classesController.delete);

export default router;
