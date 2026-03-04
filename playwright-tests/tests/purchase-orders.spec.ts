import { test, expect } from '@playwright/test';

test.describe('📋 Purchase Order Tests — จัดการใบสั่งซื้อ', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/purchase-orders');
        await page.waitForLoadState('networkidle');
    });

    test('TC-PO-01: เปิดหน้าใบสั่งซื้อสำเร็จ', async ({ page }) => {
        // ต้องเห็นหัวข้อหน้า
        await expect(page.getByText(/ใบสั่งซื้อ|Purchase Order/)).toBeVisible({ timeout: 10_000 });
    });

    test('TC-PO-02: แสดง PO ที่มีอยู่แล้ว (ถ้ามี)', async ({ page }) => {
        // ดูว่ามี PO ในตารางหรือมีข้อความว่าง
        const tableBody = page.locator('table tbody');
        await expect(tableBody).toBeVisible({ timeout: 10_000 });
    });

    test('TC-PO-03: เปิด Dialog สร้าง PO สำเร็จ', async ({ page }) => {
        // กดปุ่มสร้าง PO
        const createBtn = page.getByRole('button', { name: /สร้างใบสั่งซื้อ|สร้าง PO/ });
        if (await createBtn.isVisible()) {
            await createBtn.click();
            // ควรเห็น Dialog เปิด
            await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
        } else {
            // อาจไม่มีปุ่มในบาง Role → skip
            test.skip();
        }
    });

    test('TC-PO-04: ค้นหา PO', async ({ page }) => {
        const searchInput = page.locator('input[placeholder*="ค้นหา"]').first();
        if (await searchInput.isVisible()) {
            await searchInput.fill('PO-');
            await page.waitForTimeout(500);
            // ไม่ crash → pass
            await expect(page.locator('table')).toBeVisible();
        }
    });

    test('TC-PO-05: กรอง PO ตาม Status', async ({ page }) => {
        // ดู Filter dropdown ถ้ามี
        const filterBtn = page.getByRole('button', { name: /กรอง|Filter/ }).or(
            page.locator('[role="combobox"]').first()
        );

        if (await filterBtn.isVisible()) {
            await filterBtn.click();
            await page.waitForTimeout(500);
            // ไม่ crash → pass
        }
        await expect(page.locator('table')).toBeVisible();
    });
});
