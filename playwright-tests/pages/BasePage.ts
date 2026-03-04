import { Page, Locator, expect } from '@playwright/test';

/**
 * BasePage — คลาสแม่สำหรับทุก Page Object
 * เก็บ common actions ที่ใช้ซ้ำได้ทุกหน้า
 */
export class BasePage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    /** รอให้ Toast (shadcn) ปรากฏ และตรวจข้อความ */
    async expectToast(text: string, timeout = 10_000) {
        // shadcn/ui Toaster + Sonner ต่างกัน – เช็คทั้ง 2 variant
        const sonnerToast = this.page.locator('[data-sonner-toast]').filter({ hasText: text });
        const shadcnToast = this.page.locator('[role="status"], [data-state="open"]').filter({ hasText: text });
        await expect(sonnerToast.or(shadcnToast).first()).toBeVisible({ timeout });
    }

    /** รอให้ Toast error ปรากฏ */
    async expectErrorToast(text: string, timeout = 10_000) {
        const toast = this.page.locator('[data-sonner-toast][data-type="error"], [role="status"]').filter({ hasText: text });
        await expect(toast.first()).toBeVisible({ timeout });
    }

    /** Navigate ผ่าน sidebar */
    async navigateTo(path: string) {
        await this.page.goto(path);
        await this.page.waitForLoadState('networkidle');
    }

    /** รอ loading ข้อมูลสำเร็จ (network idle) */
    async waitForDataLoad() {
        await this.page.waitForLoadState('networkidle');
    }
}
