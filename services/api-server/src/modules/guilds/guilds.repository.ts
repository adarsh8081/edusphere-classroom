import { db } from "../../core/database/db";
import { eq, and, sql } from "drizzle-orm";
import {
    guilds, guildMembers, guildChannels, forumPosts, forumComments, careerPaths, studentCareerProgress,
    messages
} from "@edusphere/types";

export class GuildsRepository {
    async createGuild(guild: any) {
        const [created] = await db.insert(guilds).values(guild).returning();
        return created;
    }

    async getGuilds(classId?: string) {
        if (classId) return await db.select().from(guilds).where(eq(guilds.classId, classId));
        return await db.select().from(guilds);
    }

    async joinGuild(guildId: string, userId: string, role: string = "member") {
        await db.insert(guildMembers).values({ guildId, userId, role }).onConflictDoNothing();
    }

    async getGuildChannels(guildId: string) {
        return await db.select().from(guildChannels).where(eq(guildChannels.guildId, guildId));
    }

    async getGuildChannelMessages(guildId: string, channelId: string) {
        return await db.select().from(messages).where(eq(messages.conversationId, channelId));
    }

    async sendGuildChannelMessage(guildId: string, channelId: string, senderId: string, content: string) {
        const [msg] = await db.insert(messages).values({
            conversationId: channelId,
            senderId,
            content
        }).returning();
        return msg;
    }

    async createForumPost(post: any) {
        const [created] = await db.insert(forumPosts).values(post).returning();
        return created;
    }

    async getForumPosts(communityId: string = "general") {
        return await db.select().from(forumPosts).where(eq(forumPosts.communityId, communityId));
    }

    async getForumComments(postId: string) {
        return await db.select().from(forumComments).where(eq(forumComments.postId, postId));
    }

    async voteForumPost(postId: string, userId: string, direction: "up" | "down") {
        const increment = direction === "up" ? 1 : -1;
        await db.update(forumPosts)
            .set({ upvotes: sql`${forumPosts.upvotes} + ${increment}` })
            .where(eq(forumPosts.id, postId));
    }

    async createForumComment(comment: { postId: string; authorId: string; content: string; parentId?: string | null }) {
        const [created] = await db.insert(forumComments).values(comment).returning();
        return created;
    }

    async getCareerPaths(category?: string) {
        if (category) return await db.select().from(careerPaths).where(eq(careerPaths.category, category));
        return await db.select().from(careerPaths);
    }

    async enrollInCareerPath(studentId: string, pathId: string) {
        await db.insert(studentCareerProgress).values({ studentId, pathId }).onConflictDoNothing();
    }

    async getStudentCareerProgress(studentId: string) {
        return await db.select().from(studentCareerProgress).where(eq(studentCareerProgress.studentId, studentId));
    }
}

export const guildsRepository = new GuildsRepository();
