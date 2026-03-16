import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('User can register successfully', async ({ page }) => {
        // 1. Navigate to /login (AuthPage)
        await page.goto('/login');

        // 2. Click the "Sign Up" tab
        await page.click('button[role="tab"]:has-text("Sign Up")');

        // 3. Fill out the form with a random email
        const randomEmail = `testuser_${Date.now()}@example.com`;
        await page.fill('input#reg-name', 'Test Student');
        await page.fill('input#reg-email', randomEmail);
        await page.fill('input#reg-password', 'TestPass123!');

        // The Select role defaults to 'student'.

        // 4. Submit the form
        await page.click('button:has-text("Create Account")');

        // 5. Expect a redirect to the main application
        await expect(page).not.toHaveURL(/.*\/login/);
        await expect(page.locator('nav').first()).toBeVisible({ timeout: 10000 });
    });
});
