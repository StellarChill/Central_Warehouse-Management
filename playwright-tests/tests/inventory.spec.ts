import { test, expect } from '@playwright/test';

test.describe('📦 Inventory Tests — จัดการสินค้า', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/ingredients');
        await page.waitForLoadState('networkidle');
    });

    test('TC-INV-01: แสดงรายการสินค้าที่มีอยู่แล้ว (Seed Data)', async ({ page }) => {
        // ต้องเห็นสินค้าจาก seed data ของ MK Suki
        await expect(page.getByText('Sugar')).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText('Drinking Water')).toBeVisible();
        await expect(page.getByText('Beef Patty')).toBeVisible();
    });

    test('TC-INV-02: ค้นหาสินค้า', async ({ page }) => {
        // พิมพ์ค้นหา "Sugar"
        const searchInput = page.locator('input[placeholder*="ค้นหา"]').first();
        await searchInput.fill('Sugar');

        // ควรเห็น Sugar แต่ไม่เห็น Beef Patty
        await expect(page.locator('table').getByText('Sugar')).toBeVisible({ timeout: 5000 });
        // Beef Patty ควรถูก filter ออก
        await expect(page.locator('table').getByText('Beef Patty')).not.toBeVisible({ timeout: 3000 });
    });

    test('TC-INV-03: ค้นหาสินค้า — ไม่พบ', async ({ page }) => {
        const searchInput = page.locator('input[placeholder*="ค้นหา"]').first();
        await searchInput.fill('XXXXXX_NOT_EXIST');

        // ควรแสดงข้อความว่าไม่พบ
        await page.waitForTimeout(1000);
        const tableBody = page.locator('table tbody');
        const rows = tableBody.locator('tr');
        const count = await rows.count();
        // ไม่มี data rows หรือมี row แจ้งว่าไม่พบ
        expect(count).toBeLessThanOrEqual(1);
    });
});

test.describe('🏢 Supplier Tests — ตรวจสอบ Suppliers', () => {
    test('TC-SUP-01: แสดงรายการ Supplier ที่มีอยู่ (Seed Data)', async ({ page }) => {
        await page.goto('/suppliers');
        await page.waitForLoadState('networkidle');

        // MK Suki จากข้อมูล Seed มี 3 suppliers
        await expect(page.getByText(/Supplier 1/)).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText(/Supplier 2/)).toBeVisible();
    });
});
