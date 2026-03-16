import { Worker } from "bullmq";
import Redis from "ioredis";
import { aiQueueName } from "./ai.queue";
import { AIService } from "../../modules/ai/ai.service";
import { PersonalTutorService } from "../../modules/ai/personalTutor.service";
import { aiRepository } from "../../modules/ai/ai.repository";
// We use a global registry to emit back to sockets via redisPublisher or via the IO instance
import { redisPublisher } from "../redis";

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
});

export const aiWorker = new Worker(aiQueueName, async (job) => {
    console.log(`[AI Worker] Processing job ${job.name} (ID: ${job.id})`);

    try {
        let result;
        const { userId, classId } = job.data;

        switch (job.name) {
            case "summarize":
                result = await AIService.summarize(job.data.content);
                break;
            case "suggestTags":
                result = await AIService.suggestTags(job.data.text);
                break;
            case "generateQuiz":
                result = await AIService.generateQuiz(job.data.text);
                break;
            case "generateLessonPlan":
                result = await AIService.generateLessonPlan(job.data.topic, job.data.grade, job.data.duration, job.data.objectives);
                break;
            case "botAsk":
                const embedVector = await AIService.embedText(job.data.question);
                let contextChunks: string[] = [];
                let sources: string[] = [];
                if (embedVector) {
                    const matches = await aiRepository.searchDocumentChunks(embedVector, 3);
                    contextChunks = matches.map(m => m.content);
                    sources = matches.map(m => m.resourceId);
                }
                const historyItems = await aiRepository.getBotConversations(job.data.classId, job.data.userId);
                const history = historyItems.reverse().map(item => [
                    { role: "user", parts: [{ text: item.question }] },
                    { role: "model", parts: [{ text: item.answer }] },
                ]).flat();
                result = await AIService.chatWithContext(job.data.question, contextChunks, history as any);
                await aiRepository.saveBotConversation(job.data.userId, job.data.classId, job.data.question, result, Array.from(new Set(sources)));
                break;
            case "generateStudyPlan":
                result = await PersonalTutorService.generateStudyPlan(job.data.userId, job.data.classId);
                break;
            case "analyzePerformance":
                result = await PersonalTutorService.analyzeStudentPerformance(job.data.userId, job.data.classId);
                break;
            case "explainSimply":
                result = await PersonalTutorService.explainSimply(job.data.text);
                break;
            default:
                throw new Error(`Unknown job name: ${job.name}`);
        }

        // Output via pub/sub for realtime updates
        if (userId) {
            const channel = `ai_job_complete:${job.id}`;
            await redisPublisher.publish(channel, JSON.stringify({
                jobId: job.id,
                name: job.name,
                status: "completed",
                result
            }));

            // Also publish directly to user's personal channel
            await redisPublisher.publish(`user:${userId}:events`, JSON.stringify({
                type: "ai_job_completed",
                jobId: job.id,
                name: job.name,
                result
            }));
        }

        console.log(`[AI Worker] Completed job ${job.name} (ID: ${job.id})`);
        return result;
    } catch (err: any) {
        console.error(`[AI Worker] Failed job ${job.name} (ID: ${job.id}):`, err);

        if (job.data.userId) {
            await redisPublisher.publish(`user:${job.data.userId}:events`, JSON.stringify({
                type: "ai_job_failed",
                jobId: job.id,
                name: job.name,
                error: err.message
            }));
        }
        throw err;
    }
}, { connection: connection as any });

aiWorker.on("error", (err) => {
    console.error("[AI Worker] Error:", err);
});
