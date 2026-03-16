import { Request, Response, NextFunction } from "express";
import { guildsRepository } from "./guilds.repository";
import { awardXP } from "../gamification/gamification.service";

export class GuildsController {
    // ── Guilds ───────────────────────────────────────────────────────────────
    async listGuilds(req: Request, res: Response, next: NextFunction) {
        try {
            const classId = req.query.classId as string;
            const guilds = await guildsRepository.getGuilds(classId);
            res.json(guilds);
        } catch (err: any) {
            console.error("[GET /api/guilds] Error:", err.message);
            next(err);
        }
    }

    async createGuild(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user as any;
            const body = req.body; // Validation handled by middleware
            const newGuild = await guildsRepository.createGuild({ ...body, createdBy: user.id });
            await guildsRepository.joinGuild(newGuild.id, user.id, "admin");
            res.status(201).json(newGuild);
        } catch (err) {
            next(err);
        }
    }

    async getChannels(req: Request, res: Response, next: NextFunction) {
        try {
            const channels = await guildsRepository.getGuildChannels(req.params.guildId as string);
            res.json(channels);
        } catch (err) {
            next(err);
        }
    }

    async joinGuild(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user as any;
            await guildsRepository.joinGuild(req.params.guildId as string, user.id);
            res.json({ message: "Joined guild successfully" });
        } catch (err) {
            next(err);
        }
    }

    // ── Guild Channel Messages ───────────────────────────────────────────────
    async getChannelMessages(req: Request, res: Response, next: NextFunction) {
        try {
            const msgs = await guildsRepository.getGuildChannelMessages(req.params.guildId as string, req.params.channelId as string);
            res.json(msgs);
        } catch (err) {
            next(err);
        }
    }

    async sendMessage(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user as any;
            const { content } = req.body;
            if (!content?.trim()) return res.status(400).json({ message: "Content is required" });
            const msg = await guildsRepository.sendGuildChannelMessage(req.params.guildId as string, req.params.channelId as string, user.id, content);
            res.status(201).json(msg);
        } catch (err) {
            next(err);
        }
    }

    // ── Forums ───────────────────────────────────────────────────────────────
    async listForumPosts(req: Request, res: Response, next: NextFunction) {
        try {
            const communityId = req.query.communityId as string;
            const posts = await guildsRepository.getForumPosts(communityId);
            res.json(posts);
        } catch (err: any) {
            console.error("[GET /api/forums] Error:", err.message);
            next(err);
        }
    }

    async createForumPost(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user as any;
            const body = req.body; // Validation handled by middleware
            const newPost = await guildsRepository.createForumPost({ ...body, authorId: user.id });
            res.status(201).json(newPost);
        } catch (err) {
            next(err);
        }
    }

    async getForumComments(req: Request, res: Response, next: NextFunction) {
        try {
            const comments = await guildsRepository.getForumComments(req.params.postId as string);
            res.json(comments);
        } catch (err) {
            next(err);
        }
    }

    async voteForumPost(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user as any;
            const { direction } = req.body; // Validation handled by middleware
            await guildsRepository.voteForumPost(req.params.postId as string, user.id, direction);
            res.json({ success: true });
        } catch (err) {
            next(err);
        }
    }

    async createForumComment(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user as any;
            const { content, parentId } = req.body;
            if (!content?.trim()) return res.status(400).json({ message: "Content is required" });
            const comment = await guildsRepository.createForumComment({
                postId: req.params.postId as string,
                authorId: user.id,
                content,
                parentId: parentId || null,
            });
            awardXP(user.id, 20, "forum_post").catch(console.error);
            res.status(201).json(comment);
        } catch (err) {
            next(err);
        }
    }

    // ── Career Launchpad ─────────────────────────────────────────────────────
    async listCareerPaths(req: Request, res: Response, next: NextFunction) {
        try {
            const category = req.query.category as string;
            const paths = await guildsRepository.getCareerPaths(category);
            res.json(paths);
        } catch (err) {
            next(err);
        }
    }

    async enrollInCareerPath(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user as any;
            await guildsRepository.enrollInCareerPath(user.id, req.params.pathId as string);
            res.json({ message: "Enrolled in career path" });
        } catch (err) {
            next(err);
        }
    }

    async getCareerProgress(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user as any;
            const progress = await guildsRepository.getStudentCareerProgress(user.id);
            res.json(progress);
        } catch (err) {
            next(err);
        }
    }
}

export const guildsController = new GuildsController();
