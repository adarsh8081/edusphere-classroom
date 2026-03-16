import { test, expect } from '@playwright/test';

/**
 * SMOKE TESTS — EduSphere
 * Uses exact selectors from AuthPage.tsx (id="login-email", id="login-password").
 * Auth route is /login. Register is a tab on the same page ("Sign Up" tab).
 *
 * API interception: We mock /api/auth/me to 401 so React renders immediately
 * without waiting for a live backend session API.
 */

// Helper: intercept the session/me API so useAuth resolves instantly as "no user"
async function interceptAuth(page: any) {
    await page.route('**/api/auth/me', (route: any) =>
        route.fulfill({ status: 401, body: JSON.stringify({ message: 'Unauthorized' }), contentType: 'application/json' })
    );
}

test.describe('Smoke Tests', () => {

    test('login page shows EduSphere branding', async ({ page }) => {
        await interceptAuth(page);
        await page.goto('/login');
        await expect(page.locator('h2')).toContainText('EduSphere', { timeout: 5000 });
    });

    test('login page has email and password inputs', async ({ page }) => {
        await interceptAuth(page);
        await page.goto('/login');
        await expect(page.locator('#login-email')).toBeVisible({ timeout: 5000 });
        await expect(page.locator('#login-password')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('sign up tab reveals registration form', async ({ page }) => {
        await interceptAuth(page);
        await page.goto('/login');
        await page.getByRole('tab', { name: 'Sign Up' }).click();
        await expect(page.locator('#reg-name')).toBeVisible({ timeout: 5000 });
        await expect(page.locator('#reg-email')).toBeVisible();
        await expect(page.locator('#reg-password')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
    });

    test('invalid login stays on /login without navigating away', async ({ page }) => {
        await interceptAuth(page);
        await page.goto('/login');
        await page.fill('#login-email', 'nobody@example.com');
        await page.fill('#login-password', 'wrongpassword');
        await page.locator('button[type="submit"]').first().click();
        await page.waitForTimeout(2000);
        await expect(page).toHaveURL(/login/);
    });

    test('homepage redirects unauthenticated users to /login', async ({ page }) => {
        await interceptAuth(page);
        await page.goto('/');
        // ProtectedRoute should redirect to /login as soon as useAuth resolves (401 = no user)
        await expect(page).toHaveURL(/login/, { timeout: 8000 });
    });

});
