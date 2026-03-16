import { Request, Response, NextFunction } from "express";
import { messagingRepository } from "./messaging.repository";

export class MessagingController {
    // ── Conversations ────────────────────────────────────────────────────────────
    async listConversations(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user as any;
            const conversations = await messagingRepository.getConversations(user.id);
            res.json(conversations);
        } catch (err) {
            next(err);
        }
    }

    async createConversation(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user as any;
            const { type, name, participants } = req.body; // Validation handled by middleware
            const conv = await messagingRepository.createConversation(type, name);
            await messagingRepository.addParticipant(conv.id, user.id);
            for (const p of participants) {
                await messagingRepository.addParticipant(conv.id, p);
            }
            res.status(201).json(conv);
        } catch (err) {
            next(err);
        }
    }

    // ── Messages ─────────────────────────────────────────────────────────────────
    async listMessages(req: Request, res: Response, next: NextFunction) {
        try {
            const messages = await messagingRepository.getMessages(req.params.conversationId as string);
            res.json(messages);
        } catch (err) {
            next(err);
        }
    }

    async sendMessage(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user as any;
            const { content } = req.body; // Validation handled by middleware
            const msg = await messagingRepository.sendMessage(req.params.conversationId as string, user.id, content);
            res.status(201).json(msg);
        } catch (err) {
            next(err);
        }
    }
}

export const messagingController = new MessagingController();
