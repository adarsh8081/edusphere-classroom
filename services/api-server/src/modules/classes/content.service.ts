import { contentRepository } from "./content.repository";
import { AIService } from "../ai/ai.service";
import { notificationService } from "../notifications/notifications.service";
import { DocumentProcessor } from "../../infrastructure/ai/documentProcessor";

export class ContentService {
    // ── Posts ────────────────────────────────────────────────────────────────
    async getPosts(classId: string) {
        return await contentRepository.getPosts(classId);
    }

    async createPost(input: any, classId: string, authorId: string) {
        const sentimentData = await AIService.analyzeSentiment(input.content);
        const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : undefined;

        const post = await contentRepository.createPost({
            ...input,
            classId,
            authorId,
            scheduledAt,
            sentiment: sentimentData.sentiment,
            sentimentScore: sentimentData.score.toString(),
            isAnnouncement: input.isAnnouncement || false,
            poll: input.poll ? true : false
        });

        if (input.poll) {
            await contentRepository.createPoll(post.id, input.poll.question, input.poll.options);
        }

        await contentRepository.logActivity(authorId, classId, "created_post", post.id);

        if (!scheduledAt || scheduledAt <= new Date()) {
            await notificationService.notifyClass(
                classId,
                "announcement",
                `New post in ${classId}`,
                input.content,
                `/class/${classId}`
            );
        }

        return post;
    }

    async translatePost(postId: string, targetLanguage: string) {
        const post = await contentRepository.getPost(postId);
        if (!post) throw new Error("Post not found");
        return `[Translated to ${targetLanguage}]: ${post.content}`;
    }

    // ── Comments ─────────────────────────────────────────────────────────────
    async createComment(input: any, postId: string, authorId: string) {
        const sentimentData = await AIService.analyzeSentiment(input.content);
        const comment = await contentRepository.createComment({
            ...input,
            postId,
            authorId,
            sentiment: sentimentData.sentiment,
            sentimentScore: sentimentData.score.toString(),
        });

        const parentPost = await contentRepository.getPost(postId);
        if (parentPost) {
            await contentRepository.logActivity(authorId, parentPost.classId, "created_comment", comment.id);
        }

        return comment;
    }

    // ── Topics ───────────────────────────────────────────────────────────────
    async getTopics(classId: string) {
        return await contentRepository.getTopics(classId);
    }

    async createTopic(input: any, classId: string) {
        return await contentRepository.createTopic({ ...input, classId });
    }

    // ── Resources ────────────────────────────────────────────────────────────
    async getResources(topicId: string) {
        return await contentRepository.getResources(topicId);
    }

    async getResourceRecommendations(resourceId: string) {
        return await contentRepository.getResourceRecommendations(resourceId);
    }

    async createResource(input: any, topicId: string) {
        const resource = await contentRepository.createResource({ ...input, topicId });
        DocumentProcessor.processResource(
            resource.id, resource.title || "Untitled",
            resource.summary || "", resource.fileUrl
        ).catch(console.error);
        return resource;
    }

    async updateResourceVersion(resourceId: string, fileUrl: string, fileType?: string) {
        const updated = await contentRepository.updateResourceVersion(resourceId, fileUrl, fileType);
        DocumentProcessor.processResource(
            updated.id, updated.title || "Untitled",
            updated.summary || "", updated.fileUrl
        ).catch(console.error);
        return updated;
    }

    // ── Polls ────────────────────────────────────────────────────────────────
    async getPoll(postId: string) {
        return await contentRepository.getPoll(postId);
    }

    async voteInPoll(pollId: string, optionId: string, userId: string) {
        await contentRepository.voteInPoll(pollId, optionId, userId);
        const poll = await contentRepository.getPollById(pollId);
        if (poll) {
            const parentPost = await contentRepository.getPost(poll.postId);
            if (parentPost) {
                await contentRepository.logActivity(userId, parentPost.classId, "voted_poll", poll.id);
            }
        }
    }
}

export const contentService = new ContentService();
