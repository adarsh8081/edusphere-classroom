import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

/**
 * Playwright E2E Test Configuration for EduSphere Web App
 * @see https://playwright.dev/docs/test-configuration
 */

// ESM-safe __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve paths relative to THIS config file (apps/web)
const WEB_DIR = __dirname;                                             // apps/web
const API_DIR = path.resolve(__dirname, '../../services/api-server'); // services/api-server

export default defineConfig({
    testDir: './e2e',
    timeout: 30 * 1000,
    expect: {
        timeout: 5000,
    },
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:5173',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        // Firefox & Mobile Chrome can be added back once chromium baseline passes:
        // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        // { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    ],

    // Both servers start in parallel — Playwright waits for both before running tests.
    webServer: [
        {
            // ── Frontend (Vite dev server on :5173) ───────────────────────────
            command: 'npm.cmd run dev',
            url: 'http://localhost:5173',
            reuseExistingServer: true,
            timeout: 60_000,
            cwd: WEB_DIR,
        },
        {
            // ── Backend (Express API on :5000) ────────────────────────────────
            // Playwright polls GET /api/health until it returns 200.
            command: 'npx.cmd tsx src/index.ts',
            url: 'http://localhost:5000/api/health',
            reuseExistingServer: true,
            timeout: 90_000,
            cwd: API_DIR,
            env: {
                NODE_ENV: 'development',
                PORT: '5000',
            },
        },
    ],
});
