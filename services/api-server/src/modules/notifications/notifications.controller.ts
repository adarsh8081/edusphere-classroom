import { Request, Response, NextFunction } from "express";
import { notificationsRepository } from "./notifications.repository";

export class NotificationsController {
    async listNotifications(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user as any;
            const notifs = await notificationsRepository.getNotifications(user.id);
            res.json(notifs);
        } catch (err) {
            next(err);
        }
    }

    async markRead(req: Request, res: Response, next: NextFunction) {
        try {
            await notificationsRepository.markRead(req.params.id as string);
            res.json({ success: true });
        } catch (err) {
            next(err);
        }
    }

    async getPreferences(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user as any;
            const prefs = await notificationsRepository.getNotificationPreferences(user.id);
            // Supply default preferences if none exist
            res.json(prefs?.preferences || {
                newPost: { inApp: true, email: false, push: false },
                newComment: { inApp: true, email: false, push: false },
                assignmentCreated: { inApp: true, email: true, push: false },
                gradePublished: { inApp: true, email: true, push: false },
                attendanceMarked: { inApp: true, email: false, push: false }
            });
        } catch (err) {
            next(err);
        }
    }

    async updatePreferences(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user as any;
            await notificationsRepository.updateNotificationPreferences(user.id, req.body);
            res.json({ success: true });
        } catch (err) {
            next(err);
        }
    }
}

export const notificationsController = new NotificationsController();
