import { db } from "../../core/database/db";
import { eq, desc } from "drizzle-orm";
import { conversations, conversationParticipants, messages } from "@edusphere/types";

export class MessagingRepository {
    async createConversation(type: string, name?: string, classId?: string) {
        const [conv] = await db.insert(conversations).values({ type, name, classId }).returning();
        return conv;
    }

    async addParticipant(conversationId: string, userId: string) {
        await db.insert(conversationParticipants).values({ conversationId, userId }).onConflictDoNothing();
    }

    async getConversations(userId: string) {
        const participations = await db.select().from(conversationParticipants).where(eq(conversationParticipants.userId, userId));
        const result = [];
        for (const p of participations) {
            const [conv] = await db.select().from(conversations).where(eq(conversations.id, p.conversationId));
            if (conv) {
                const lastMessages = await db.select().from(messages).where(eq(messages.conversationId, conv.id)).orderBy(desc(messages.createdAt)).limit(1);
                result.push({ ...conv, lastMessage: lastMessages[0] });
            }
        }
        return result;
    }

    async getMessages(conversationId: string) {
        return await db.select().from(messages).where(eq(messages.conversationId, conversationId));
    }

    async sendMessage(conversationId: string, senderId: string, content: string) {
        const [msg] = await db.insert(messages).values({ conversationId, senderId, content }).returning();
        return msg;
    }
}

export const messagingRepository = new MessagingRepository();
