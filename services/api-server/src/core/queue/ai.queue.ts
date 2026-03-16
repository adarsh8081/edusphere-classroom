import { Queue } from "bullmq";
import Redis from "ioredis";

// Reuse the existing redis connection from the core module
export const aiQueueName = "ai-generation-queue";

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null, // Required by bullmq
});

export const aiQueue = new Queue(aiQueueName, {
    connection: connection as any,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 2000,
        },
        removeOnComplete: true, // Auto clean up
        removeOnFail: 100, // Keep last 100 failures for debugging
    },
});
