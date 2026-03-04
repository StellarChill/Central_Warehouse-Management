import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * LoginPage POM — จัดการหน้าเข้าสู่ระบบ
 */
export class LoginPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    async goto() {
        await this.page.goto('/login');
        await this.page.waitForLoadState('networkidle');
    }

    async login(username: string, password: string) {
        await this.page.locator('#username').fill(username);
        await this.page.locator('#password').fill(password);
        await this.page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
    }

    async verifyLoginSuccess() {
        // ต้องหลุดจากหน้า Login ภายใน 10 วินาที
        await expect(this.page.locator('#username')).not.toBeVisible({ timeout: 10_000 });
    }

    async verifyLoginFailed(errorText?: string) {
        const alert = this.page.locator('[role="alert"]');
        await expect(alert).toBeVisible({ timeout: 5000 });
        if (errorText) {
            await expect(alert).toContainText(errorText);
        }
    }
}
