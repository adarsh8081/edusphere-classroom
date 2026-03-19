import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vitest/config';

// Load .env manually for Vitest workers
const envPath = path.resolve(__dirname, '.env');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const getEnv = (key: string) => {
    const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
    return match ? match[1].trim() : undefined;
};

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
            DATABASE_URL: getEnv('DATABASE_URL') || '',
            REDIS_URL: getEnv('REDIS_URL') || '',
            GOOGLE_GEMINI_API_KEY: getEnv('GOOGLE_GEMINI_API_KEY') || 'test_key',
            SESSION_SECRET: getEnv('SESSION_SECRET') || 'test_secret',
            NODE_ENV: 'test'
        },
        alias: {
            '@db': '../../database',
            '@edusphere/database': '../../packages/database/src',
            '@edusphere/types': '../../packages/types/src',
            '@core': './src/core',
            '@modules': './src/modules'
        }
    },
});

