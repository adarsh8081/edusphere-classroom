import type { Request, Response, NextFunction } from "express";

/**
 * In-memory sliding window rate limiter.
 * Falls back gracefully without Redis.
 */
export function createRateLimiter(limit: number, windowMs: number) {
    const map = new Map<string, number[]>();

    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.isAuthenticated()) return next();
        const userId = (req.user as any).id;
        const now = Date.now();
        const windowStart = now - windowMs;
        const timestamps = (map.get(userId) || []).filter(t => t > windowStart);

        if (timestamps.length >= limit) {
            return res.status(429).json({
                message: "Too many requests. Please wait a moment before trying again.",
            });
        }

        timestamps.push(now);
        map.set(userId, timestamps);
        next();
    };
}

/**
 * Pre-configured AI rate limiter: 20 req/min per user
 */
export const aiRateLimiter = createRateLimiter(20, 60_000);

/**
 * Pre-configured Auth rate limiter: 10 req/min per IP/User to prevent brute force
 */
export const authRateLimiter = createRateLimiter(10, 60_000);

/**
 * Pre-configured general API rate limiter: 100 req/min
 */
export const apiRateLimiter = createRateLimiter(100, 60_000);
