import { Router } from "express";
import { api } from "@edusphere/api-client";
import { requireAuth } from "../../core/middleware/auth";
import { validateBody } from "../../core/middleware/validation";
import { messagingController } from "./messaging.controller";

const router = Router();

// ── Conversations ────────────────────────────────────────────────────────────

router.get(api.messaging.conversations.list.path, requireAuth, messagingController.listConversations);
router.post(api.messaging.conversations.create.path, requireAuth, validateBody(api.messaging.conversations.create.input), messagingController.createConversation);

// ── Messages ─────────────────────────────────────────────────────────────────

router.get(api.messaging.messages.list.path, requireAuth, messagingController.listMessages);
router.post(api.messaging.messages.send.path, requireAuth, validateBody(api.messaging.messages.send.input), messagingController.sendMessage);

export default router;
