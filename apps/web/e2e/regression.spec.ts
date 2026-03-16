import { test, expect } from '@playwright/test';

/**
 * REGRESSION TESTS — EduSphere
 * Verify previously working features haven't broken after code changes.
 */

test.describe('Regression: Auth Page', () => {

    test('auth page renders without JS errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', err => errors.push(err.message));
        await page.goto('/login');
        // Give the page a second to settle
        await page.waitForTimeout(1500);
        expect(errors).toHaveLength(0);
    });

    test('auth page shows both Sign In and Sign Up tabs', async ({ page }) => {
        await page.goto('/login');
        await expect(page.locator('[role="tab"]:has-text("Sign In")')).toBeVisible();
        await expect(page.locator('[role="tab"]:has-text("Sign Up")')).toBeVisible();
    });

    test('switching to Sign Up tab does not cause JS error', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', err => errors.push(err.message));
        await page.goto('/login');
        await page.click('[role="tab"]:has-text("Sign Up")');
        await page.waitForTimeout(500);
        expect(errors).toHaveLength(0);
    });

});

test.describe('Regression: Navigation', () => {

    test('root path responds (not 404)', async ({ page }) => {
        const response = await page.goto('/');
        expect(response?.status()).not.toBe(404);
    });

    test('unknown route redirects gracefully (no white screen)', async ({ page }) => {
        await page.goto('/this-route-does-not-exist-xyz');
        // Should either redirect to /auth or show a 404 page — not a blank screen
        const bodyText = await page.locator('body').textContent();
        expect(bodyText?.trim().length).toBeGreaterThan(0);
    });

    test('OAuth Google button is present on auth page', async ({ page }) => {
        await page.goto('/login');
        const googleBtn = page.locator('button:has-text("Google")');
        await expect(googleBtn).toBeVisible();
    });

});
