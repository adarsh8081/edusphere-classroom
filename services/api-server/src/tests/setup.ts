import 'dotenv/config';
import { vi } from 'vitest';

// Mock the database for unit testing (commented out for integration tests)
/*
vi.mock('../../core/database/db', () => ({
    db: {
        select: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        execute: vi.fn()
    }
}));
*/

// Mock the Redis setup for BullMQ / Socket.io
vi.mock('../../core/redis/index', () => ({
    redisClient: {
        get: vi.fn(),
        set: vi.fn(),
        on: vi.fn(),
    },
    redisPublisher: { publish: vi.fn() },
    redisSubscriber: { subscribe: vi.fn(), on: vi.fn() },
}));
