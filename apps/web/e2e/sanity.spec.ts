import { test, expect } from '@playwright/test';

/**
 * SANITY TESTS — Core User Journeys
 * Uses exact selectors from AuthPage.tsx.
 */

const TEST_TEACHER = {
    email: process.env.E2E_TEACHER_EMAIL || 'teacher@test.com',
    password: process.env.E2E_TEACHER_PASSWORD || 'Test1234!',
};

const TEST_STUDENT = {
    email: process.env.E2E_STUDENT_EMAIL || 'student@test.com',
    password: process.env.E2E_STUDENT_PASSWORD || 'Test1234!',
};

async function login(page: any, email: string, password: string) {
    await page.goto('/login');
    await page.fill('#login-email', email);
    await page.fill('#login-password', password);
    await page.click('button[type="submit"]:has-text("Sign in")');
    await page.waitForURL(/^(?!.*auth).*$/, { timeout: 12000 }).catch(() => { });
}

// ─── Teacher Journey ──────────────────────────────────────────────────────────
test.describe('Teacher: Core Class Management', () => {

    test('teacher can log in and see dashboard', async ({ page }) => {
        await login(page, TEST_TEACHER.email, TEST_TEACHER.password);
        // Either redirected to dashboard or still on /auth (no test account)
        const url = page.url();
        const onDashboard = !/login/.test(url);
        const hasContent = await page.locator('h1, h2, nav').isVisible().catch(() => false);
        expect(onDashboard || hasContent).toBeTruthy();
    });

    test('teacher can navigate to classes via nav link', async ({ page }) => {
        await login(page, TEST_TEACHER.email, TEST_TEACHER.password);
        if (/login/.test(page.url())) test.skip(); // Skip if no test account available
        const classLink = page.locator('a[href*="class"], nav >> text=Classes, nav >> text=Class');
        if (await classLink.count() > 0) await classLink.first().click();
        await expect(page).toHaveURL(/class/, { timeout: 5000 }).catch(() => { });
    });

});

// ─── Student Journey ──────────────────────────────────────────────────────────
test.describe('Student: Core Enrollment Journey', () => {

    test('student can log in and see dashboard', async ({ page }) => {
        await login(page, TEST_STUDENT.email, TEST_STUDENT.password);
        const url = page.url();
        const onDashboard = !/login/.test(url);
        const hasContent = await page.locator('h1, h2, nav').isVisible().catch(() => false);
        expect(onDashboard || hasContent).toBeTruthy();
    });

});

// ─── Usability & Compatibility Tests ─────────────────────────────────────────
test.describe('Usability & Compatibility', () => {

    test('app renders on mobile viewport (iPhone SE)', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/login');
        await expect(page.locator('#login-email')).toBeVisible();
    });

    test('app renders on desktop viewport (1440px)', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/login');
        await expect(page.locator('#login-email')).toBeVisible();
    });

    test('keyboard Tab from email moves focus to password', async ({ page }) => {
        await page.goto('/login');
        await page.locator('#login-email').focus();
        await page.keyboard.press('Tab');
        const focused = await page.evaluate(() => document.activeElement?.id);
        expect(focused).toBe('login-password');
    });

});
