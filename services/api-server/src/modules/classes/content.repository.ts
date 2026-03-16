import { db } from "../../core/database/db";
import { eq, desc, asc, and, sql } from "drizzle-orm";
import { posts, comments, topics, resources, polls, pollOptions, pollVotes, userActivities, type InsertPost, type InsertComment, type InsertTopic, type InsertResource } from "@edusphere/types";

export class ContentRepository {
    // ── Posts ────────────────────────────────────────────────────────────────
    async getPosts(classId: string) {
        return await db.select().from(posts).where(eq(posts.classId, classId)).orderBy(desc(posts.createdAt));
    }

    async getPost(postId: string) {
        const [post] = await db.select().from(posts).where(eq(posts.id, postId));
        return post;
    }

    async createPost(post: Omit<InsertPost, "id" | "createdAt" | "updatedAt">) {
        const [newPost] = await db.insert(posts).values(post as any).returning();
        return newPost;
    }

    // ── Comments ─────────────────────────────────────────────────────────────
    async createComment(comment: Omit<InsertComment, "id" | "createdAt" | "updatedAt">) {
        const [newComment] = await db.insert(comments).values(comment as any).returning();
        return newComment;
    }

    async getCommentsByPostId(postId: string) {
        return await db.select().from(comments).where(eq(comments.postId, postId)).orderBy(asc(comments.createdAt));
    }

    // ── Topics ───────────────────────────────────────────────────────────────
    async getTopics(classId: string) {
        return await db.select().from(topics).where(eq(topics.classId, classId)).orderBy(desc(topics.createdAt));
    }

    async createTopic(topic: Omit<InsertTopic, "id" | "createdAt" | "updatedAt">) {
        const [newTopic] = await db.insert(topics).values(topic as any).returning();
        return newTopic;
    }

    // ── Resources ────────────────────────────────────────────────────────────
    async getResources(topicId: string) {
        return await db.select().from(resources).where(eq(resources.topicId, topicId)).orderBy(desc(resources.createdAt));
    }

    async getResource(resourceId: string) {
        const [resource] = await db.select().from(resources).where(eq(resources.id, resourceId));
        return resource;
    }

    async createResource(resource: Omit<InsertResource, "id" | "createdAt" | "updatedAt">) {
        const [newResource] = await db.insert(resources).values(resource as any).returning();
        return newResource;
    }

    async updateResourceVersion(resourceId: string, fileUrl: string, fileType?: string) {
        const [updated] = await db.update(resources)
            .set({ fileUrl, fileType })
            .where(eq(resources.id, resourceId))
            .returning();
        return updated;
    }

    async getResourceRecommendations(resourceId: string) {
        // Mock method for now until recommendation engine is fully typed
        return [];
    }

    // ── Polls ────────────────────────────────────────────────────────────────
    async createPoll(postId: string, question: string, options: string[]) {
        const [poll] = await db.insert(polls).values({ postId, question }).returning();
        const optionInserts = options.map((optionText, idx) => ({ pollId: poll.id, optionText, position: idx }));
        await db.insert(pollOptions).values(optionInserts);
        return poll;
    }

    async getPoll(postId: string) {
        const [poll] = await db.select().from(polls).where(eq(polls.postId, postId));
        if (!poll) return null;
        const opts = await db.select().from(pollOptions).where(eq(pollOptions.pollId, poll.id)).orderBy(asc(pollOptions.position));
        const votes = await db.select().from(pollVotes).where(eq(pollVotes.pollId, poll.id));
        return { ...poll, options: opts, votes };
    }

    async getPollById(pollId: string) {
        const [poll] = await db.select().from(polls).where(eq(polls.id, pollId));
        return poll;
    }

    async voteInPoll(pollId: string, optionId: string, userId: string) {
        await db.delete(pollVotes).where(and(eq(pollVotes.pollId, pollId), eq(pollVotes.userId, userId)));
        await db.insert(pollVotes).values({ pollId, optionId, userId });
    }

    // ── Analytics / Activity ─────────────────────────────────────────────────
    async logActivity(userId: string, classId: string, activityType: string, referenceId?: string) {
        await db.insert(userActivities).values({ userId, classId, activityType, referenceId });
    }
}

export const contentRepository = new ContentRepository();
