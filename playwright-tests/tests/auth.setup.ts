import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '..', '.auth', 'user.json');

setup('authenticate as mk-admin', async ({ page }) => {
    // Go to login page
    await page.goto('/login');
    await page.waitForLoadState('load');

    // Fill credentials (seed data: mk-admin / admin123)
    await page.locator('#login-username').fill('mk-admin');
    await page.locator('#login-password').fill('admin123');

    // Click submit button
    await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();

    // Wait for redirect to dashboard (login success)
    await page.waitForURL('**/*', { timeout: 15_000 });
    await expect(page.locator('#login-username')).not.toBeVisible({ timeout: 10_000 });

    // Save auth state
    await page.context().storageState({ path: authFile });
});
