import { test, expect } from '@playwright/test';

test.describe('📦 Inventory Tests — จัดการสินค้า', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/ingredients');
        await page.waitForLoadState('networkidle');
    });

    test('TC-INV-01: แสดงรายการสินค้าที่มีอยู่แล้ว (Seed Data)', async ({ page }) => {
        // ต้องเห็นสินค้าจาก seed data ของ MK Suki (ใช้ heading เพื่อหลีกเลี่ยง strict mode violation กับ code เช่น MK-SUGAR)
        await expect(page.getByRole('heading', { name: 'Sugar' })).toBeVisible({ timeout: 10_000 });
        await expect(page.getByRole('heading', { name: 'Drinking Water' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Beef Patty' })).toBeVisible();
    });

    test('TC-INV-02: ค้นหาสินค้า', async ({ page }) => {
        // พิมพ์ค้นหา "Sugar" — placeholder จริงคือ "ค้นหา SKU หรือชื่อวัตถุดิบ..."
        const searchInput = page.locator('input[placeholder*="ค้นหา"]').first();
        await searchInput.fill('Sugar');

        // ควรเห็น Sugar (หน้านี้ใช้ card layout ไม่ใช่ table)
        await expect(page.getByRole('heading', { name: 'Sugar' })).toBeVisible({ timeout: 5000 });
        // Beef Patty ควรถูก filter ออก
        await expect(page.getByRole('heading', { name: 'Beef Patty' })).not.toBeVisible({ timeout: 3000 });
    });

    test('TC-INV-03: ค้นหาสินค้า — ไม่พบ', async ({ page }) => {
        const searchInput = page.locator('input[placeholder*="ค้นหา"]').first();
        await searchInput.fill('XXXXXX_NOT_EXIST');

        // ควรแสดงข้อความว่าไม่พบ (card layout — ไม่มี table)
        await page.waitForTimeout(1000);
        await expect(page.getByText('ไม่พบรายการที่ต้องการ')).toBeVisible({ timeout: 5000 });
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
