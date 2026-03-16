import { Router } from "express";
import { api } from "@edusphere/api-client";
import { requireAuth } from "../../core/middleware/auth";
import { validateBody } from "../../core/middleware/validation";
import { guildsController } from "./guilds.controller";

const router = Router();

// ── Guilds ───────────────────────────────────────────────────────────────────

router.get(api.guilds.list.path, requireAuth, guildsController.listGuilds);
router.post(api.guilds.create.path, requireAuth, validateBody(api.guilds.create.input), guildsController.createGuild);
router.get(api.guilds.channels.path, requireAuth, guildsController.getChannels);
router.post(api.guilds.join.path, requireAuth, guildsController.joinGuild);

// ── Guild Channel Messages ───────────────────────────────────────────────────

router.get("/api/guilds/:guildId/channels/:channelId/messages", requireAuth, guildsController.getChannelMessages);
router.post("/api/guilds/:guildId/channels/:channelId/messages", requireAuth, guildsController.sendMessage);

// ── Forums ───────────────────────────────────────────────────────────────────

router.get(api.forums.list.path, requireAuth, guildsController.listForumPosts);
router.post(api.forums.create.path, requireAuth, validateBody(api.forums.create.input), guildsController.createForumPost);
router.get(api.forums.comments.path, requireAuth, guildsController.getForumComments);
router.post(api.forums.vote.path, requireAuth, validateBody(api.forums.vote.input), guildsController.voteForumPost);
router.post("/api/forums/posts/:postId/comments", requireAuth, guildsController.createForumComment);

// ── Career Launchpad ─────────────────────────────────────────────────────────

router.get(api.career.list.path, requireAuth, guildsController.listCareerPaths);
router.post(api.career.enroll.path, requireAuth, guildsController.enrollInCareerPath);
router.get(api.career.progress.path, requireAuth, guildsController.getCareerProgress);

export default router;
