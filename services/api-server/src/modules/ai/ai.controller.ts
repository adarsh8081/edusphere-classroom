import { Request, Response, NextFunction } from "express";
import { contentRepository } from "../classes/content.repository";
import { aiRepository } from "./ai.repository";
import { AIService } from "./ai.service";
import { PersonalTutorService } from "./personalTutor.service";
import { aiQueue } from "../../core/queue/ai.queue";

export class AIController {
    async summarize(req: Request, res: Response, next: NextFunction) {
        try {
            const { resourceId, text } = req.body;
            let content = text;
            if (resourceId) {
                const resource = await contentRepository.getResource(resourceId);
                if (resource && resource.fileType === "file") {
                    // Future: extract text from file
                }
            }
            if (!content) return res.status(400).send("No content to summarize");
            const job = await aiQueue.add("summarize", { content, userId: req.user?.id });
            res.status(202).json({ jobId: job.id, message: "Summarization job queued" });
        } catch (error) {
            next(error);
        }
    }

    async suggestTags(req: Request, res: Response, next: NextFunction) {
        try {
            const { text } = req.body;
            if (!text) return res.status(400).send("No content for tagging");
            const job = await aiQueue.add("suggestTags", { text, userId: req.user?.id });
            res.status(202).json({ jobId: job.id, message: "Tag suggestion job queued" });
        } catch (error) {
            next(error);
        }
    }

    async generateQuiz(req: Request, res: Response, next: NextFunction) {
        try {
            const { text } = req.body;
            if (!text) return res.status(400).send("No content for quiz generation");
            const job = await aiQueue.add("generateQuiz", { text, userId: req.user?.id });
            res.status(202).json({ jobId: job.id, message: "Quiz generation job queued" });
        } catch (error) {
            next(error);
        }
    }

    async lessonPlan(req: Request, res: Response, next: NextFunction) {
        try {
            const { topic, grade, duration, objectives } = req.body;
            const job = await aiQueue.add("generateLessonPlan", { topic, grade, duration, objectives, userId: req.user?.id });
            res.status(202).json({ jobId: job.id, message: "Lesson plan job queued" });
        } catch (error) {
            next(error);
        }
    }

    async botAsk(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user!;
            const { question, classId } = req.body;
            if (!question || !classId) return res.status(400).send("Question and classId required");

            const job = await aiQueue.add("botAsk", { question, classId, userId: user.id });
            res.status(202).json({ jobId: job.id, message: "Bot request queued" });
        } catch (error) {
            next(error);
        }
    }

    async botHistory(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user!;
            const history = await aiRepository.getBotConversations(req.params.classId as string, user.id);
            res.json(history);
        } catch (error) {
            next(error);
        }
    }

    async getLearningPath(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user!;
            const path = await aiRepository.generateLearningPath(user.id, req.params.classId as string);
            res.json(path);
        } catch (error) {
            next(error);
        }
    }

    async generateLearningPath(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user!;
            const path = await aiRepository.generateLearningPath(user.id, req.params.classId as string);
            res.json(path);
        } catch (error) {
            next(error);
        }
    }

    async completePathItem(req: Request, res: Response, next: NextFunction) {
        try {
            await aiRepository.completeLearningPathItem(req.params.itemId as string);
            res.sendStatus(200);
        } catch (error) {
            next(error);
        }
    }

    async setupVector(req: Request, res: Response, next: NextFunction) {
        try {
            await aiRepository.createVectorExtension();
            res.json({ message: "pgvector initialized" });
        } catch (error) {
            next(error);
        }
    }

    async getRecommendations(req: Request, res: Response, next: NextFunction) {
        try {
            const gaps = await aiRepository.getLearningGaps(req.user!.id, req.params.classId as string);
            res.json(gaps);
        } catch (error) {
            next(error);
        }
    }

    async getStudyPlan(req: Request, res: Response, next: NextFunction) {
        try {
            let plan = await aiRepository.getAIStudyPlan(req.user!.id, req.params.classId as string);
            if (!plan) {
                // Return a queued response if plan needs to be generated
                const job = await aiQueue.add("generateStudyPlan", { userId: req.user!.id, classId: req.params.classId as string });
                return res.status(202).json({ jobId: job.id, message: "Study plan generation job queued" });
            }
            res.json(plan);
        } catch (error) {
            next(error);
        }
    }

    async analyzePerformance(req: Request, res: Response, next: NextFunction) {
        try {
            const job = await aiQueue.add("analyzePerformance", { userId: req.user!.id, classId: req.params.classId as string });
            res.status(202).json({ jobId: job.id, message: "Performance analysis job queued" });
        } catch (error) {
            next(error);
        }
    }

    async explainSimply(req: Request, res: Response, next: NextFunction) {
        try {
            const { text } = req.body;
            if (!text) return res.status(400).json({ error: "No text provided" });
            const job = await aiQueue.add("explainSimply", { text, userId: req.user?.id });
            res.status(202).json({ jobId: job.id, message: "Explanation job queued" });
        } catch (error) {
            next(error);
        }
    }
}

export const aiController = new AIController();
