import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('🔐 Auth Tests — เข้าสู่ระบบ / ออกจากระบบ', () => {
    // Auth tests ไม่ใช้ storageState (ต้อง login เอง)
    test.use({ storageState: { cookies: [], origins: [] } });

    test('TC-AUTH-01: Login สำเร็จ ด้วย mk-admin', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();

        await loginPage.login('mk-admin', 'admin123');
        await loginPage.verifyLoginSuccess();

        // ตรวจว่าหลุดจากหน้า login ไปหน้าหลัก
        await expect(page).not.toHaveURL(/\/login/);
    });

    test('TC-AUTH-02: Login ล้มเหลว ด้วย password ผิด', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();

        await loginPage.login('mk-admin', 'wrongpassword');
        await loginPage.verifyLoginFailed();

        // ยังอยู่หน้า login
        await expect(page).toHaveURL(/\/login/);
    });

    test('TC-AUTH-03: Login ล้มเหลว ด้วย username ที่ไม่มีอยู่', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();

        await loginPage.login('nonexistent-user', 'admin123');
        await loginPage.verifyLoginFailed();
    });

    test('TC-AUTH-04: Login ล้มเหลว เมื่อไม่กรอกข้อมูล', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();

        // กด submit โดยไม่กรอก
        await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();

        // ควรมี validation error
        await expect(page.getByText(/กรุณากรอก/)).toBeVisible({ timeout: 5000 });
    });

    test('TC-AUTH-05: Login สำเร็จ ด้วย platform-admin', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();

        await loginPage.login('platform-admin', 'admin123');
        await loginPage.verifyLoginSuccess();

        // ควรไปหน้า platform admin
        await expect(page).not.toHaveURL(/\/login/);
    });
});
