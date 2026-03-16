import { Request, Response } from "express";
import { contentService } from "./content.service";
import { api } from "@edusphere/api-client";
import { z } from "zod";

export class ContentController {
    // ── Posts ────────────────────────────────────────────────────────────────
    getPosts = async (req: Request, res: Response) => {
        const posts = await contentService.getPosts(req.params.classId as string);
        res.json(posts);
    };

    createPost = async (req: Request, res: Response) => {
        const user = req.user!;
        try {
            const input = api.posts.create.input.parse(req.body);
            const post = await contentService.createPost(input, req.params.classId as string, user.id);
            res.status(201).json(post);
        } catch (err) {
            if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
            res.status(500).json({ message: "Internal error" });
        }
    };

    translatePost = async (req: Request, res: Response) => {
        try {
            const { targetLanguage } = api.posts.translate.input.parse(req.body);
            const translatedText = await contentService.translatePost(req.params.postId as string, targetLanguage);
            res.json({ translatedText });
        } catch (err: any) {
            if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
            if (err.message === "Post not found") return res.status(404).json({ message: err.message });
            res.status(500).json({ message: "Internal error" });
        }
    };

    // ── Comments ─────────────────────────────────────────────────────────────
    createComment = async (req: Request, res: Response) => {
        const user = req.user!;
        try {
            const input = api.comments.create.input.parse(req.body);
            const comment = await contentService.createComment(input, req.params.postId as string, user.id);
            res.status(201).json(comment);
        } catch (err) {
            if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
            res.status(500).json({ message: "Internal error" });
        }
    };

    // ── Topics ───────────────────────────────────────────────────────────────
    getTopics = async (req: Request, res: Response) => {
        const topics = await contentService.getTopics(req.params.classId as string);
        res.json(topics);
    };

    createTopic = async (req: Request, res: Response) => {
        try {
            const input = api.topics.create.input.parse(req.body);
            const topic = await contentService.createTopic(input, req.params.classId as string);
            res.status(201).json(topic);
        } catch (err) {
            if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
            res.status(500).json({ message: "Internal error" });
        }
    };

    // ── Resources ────────────────────────────────────────────────────────────
    getResources = async (req: Request, res: Response) => {
        const resources = await contentService.getResources(req.params.topicId as string);
        res.json(resources);
    };

    getResourceRecommendations = async (req: Request, res: Response) => {
        const recs = await contentService.getResourceRecommendations(req.params.resourceId as string);
        res.json(recs);
    };

    createResource = async (req: Request, res: Response) => {
        try {
            const input = api.resources.create.input.parse(req.body);
            const resource = await contentService.createResource(input, req.params.topicId as string);
            res.status(201).json(resource);
        } catch (err) {
            if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
            res.status(500).json({ message: "Internal error" });
        }
    };

    updateResourceVersion = async (req: Request, res: Response) => {
        try {
            const { fileUrl, fileType } = req.body;
            if (!fileUrl) return res.status(400).send("New fileUrl is required");
            const updated = await contentService.updateResourceVersion(req.params.id as string, fileUrl, fileType);
            res.json(updated);
        } catch (err) {
            res.status(500).json({ message: "Internal error" });
        }
    };

    // ── Polls ────────────────────────────────────────────────────────────────
    getPoll = async (req: Request, res: Response) => {
        const poll = await contentService.getPoll(req.params.postId as string);
        res.json(poll);
    };

    voteInPoll = async (req: Request, res: Response) => {
        const user = req.user!;
        try {
            const { optionId } = api.polls.vote.input.parse(req.body);
            await contentService.voteInPoll(req.params.pollId as string, optionId, user.id);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ message: "Internal error" });
        }
    };
}

export const contentController = new ContentController();
