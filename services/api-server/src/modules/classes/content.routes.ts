import { Router } from "express";
import { api } from "@edusphere/api-client";
import { requireAuth, requireTeacher } from "../../core/middleware/auth";
import { contentController } from "./content.controller";

const router = Router();

// ── Posts ────────────────────────────────────────────────────────────────────
router.get(api.posts.list.path, requireAuth, contentController.getPosts);
router.post(api.posts.create.path, requireAuth, contentController.createPost);
router.post(api.posts.translate.path, requireAuth, contentController.translatePost);

// ── Comments ─────────────────────────────────────────────────────────────────
router.post(api.comments.create.path, requireAuth, contentController.createComment);

// ── Topics ───────────────────────────────────────────────────────────────────
router.get(api.topics.list.path, requireAuth, contentController.getTopics);
router.post(api.topics.create.path, requireAuth, contentController.createTopic);

// ── Resources ────────────────────────────────────────────────────────────────
router.get(api.resources.list.path, requireAuth, contentController.getResources);
router.get("/api/resources/:resourceId/recommendations", requireAuth, contentController.getResourceRecommendations);
router.post(api.resources.create.path, requireTeacher, contentController.createResource);
router.patch("/api/resources/:id/version", requireTeacher, contentController.updateResourceVersion);

// ── Polls ────────────────────────────────────────────────────────────────────
router.get(api.polls.get.path, contentController.getPoll);
router.post(api.polls.vote.path, requireAuth, contentController.voteInPoll);

export default router;
