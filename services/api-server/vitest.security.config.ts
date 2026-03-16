/**
 * Vitest config specifically for LIVE security integration tests.
 * These tests require the API server to be running on localhost:3001.
 *
 * Usage:
 *   npm run test:security   (or: npx vitest run --config vitest.security.config.ts)
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/tests/security/**/*.test.ts'],
        env: {
            DATABASE_URL: 'postgres://dummy:dummy@localhost:5432/dummy',
            REDIS_URL: 'redis://localhost:6379',
            GOOGLE_GEMINI_API_KEY: 'test_key',
            SESSION_SECRET: 'test_secret',
        },
        // Give live-server tests a longer timeout
        testTimeout: 30_000,
    },
});
