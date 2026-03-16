import { Router } from "express";
import { requireAuth } from "../../core/middleware/auth";
import { multerUpload } from "../../infrastructure/storage/fileUploadService";
import { usersController } from "./users.controller";

const router = Router();

// ── User Search ──────────────────────────────────────────────────────────────
router.get("/api/users/search", requireAuth, usersController.search);

// ── Profile ──────────────────────────────────────────────────────────────────
router.get("/api/users/profile", requireAuth, usersController.getProfile);
router.patch("/api/users/profile", requireAuth, usersController.updateProfile);

// ── File Upload ──────────────────────────────────────────────────────────────
router.post("/api/upload", multerUpload.single("file"), requireAuth, usersController.uploadFile);
router.post("/api/upload/presign", requireAuth, usersController.presignUpload);
router.post("/api/upload/avatar", multerUpload.single("avatar"), requireAuth, usersController.uploadAvatar);

export default router;
