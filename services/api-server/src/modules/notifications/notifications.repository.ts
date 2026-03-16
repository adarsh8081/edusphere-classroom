import { db } from "../../core/database/db";
import { eq, desc } from "drizzle-orm";
import { notifications, notificationPreferences } from "@edusphere/types";

export class NotificationsRepository {
    async getNotifications(userId: string) {
        return await db.select().from(notifications)
            .where(eq(notifications.userId, userId))
            .orderBy(desc(notifications.createdAt));
    }

    async markRead(id: string) {
        await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
    }

    async createNotification(userId: string, type: string, content: string, referenceId?: string) {
        await db.insert(notifications).values({
            userId,
            type,
            content,
            referenceId,
        });
    }

    async getNotificationPreferences(userId: string) {
        const [prefs] = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId));
        return prefs || null;
    }

    async updateNotificationPreferences(userId: string, preferences: any) {
        await db.insert(notificationPreferences).values({
            userId,
            preferences,
        }).onConflictDoUpdate({
            target: [notificationPreferences.userId],
            set: { preferences }
        });
    }
}

export const notificationsRepository = new NotificationsRepository();
