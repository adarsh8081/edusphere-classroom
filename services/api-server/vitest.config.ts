import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./src/tests/setup.ts'],
        exclude: [
            '**/node_modules/**',
            // Performance scripts are standalone (run with tsx), not vitest suites
            '**/tests/performance/**',
            // Security tests are live-server integration tests, run separately with: npm run test:security
            ...(process.env.SECURITY_TESTS_LIVE ? [] : ['**/tests/security/**']),
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
        },
        env: {
            DATABASE_URL: 'postgres://dummy:dummy@localhost:5432/dummy',
            REDIS_URL: 'redis://localhost:6379',
            GOOGLE_GEMINI_API_KEY: 'test_key',
            SESSION_SECRET: 'test_secret'
        }
    },
});

