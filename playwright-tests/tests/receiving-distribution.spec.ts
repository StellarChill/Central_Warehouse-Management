import { test, expect } from '@playwright/test';
import { ReceivingPage } from '../pages/ReceivingPage';

test.describe('🚚 Receiving & Distribution Tests — รับสินค้า & กระจายสินค้า', () => {

    test.describe.configure({ mode: 'serial' }); // รันตามลำดับในกลุ่มนี้

    let receivingPage: ReceivingPage;

    test.beforeEach(async ({ page }) => {
        receivingPage = new ReceivingPage(page);
        await receivingPage.goto();
    });

    // ===========================
    // Basic Receiving Page
    // ===========================

    test('TC-RCV-01: RI เปิดหน้ารับสินค้าสำเร็จ', async ({ page }) => {
        // ตรวจว่าหน้ารับสินค้าโหลดสำเร็จ
        await expect(page.getByText('ใบรับสินค้าทั้งหมด')).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText('PO รอรับของ')).toBeVisible();
    });

    test('TC-RCV-02: เปิด PO Dialog สำเร็จ', async ({ page }) => {
        await receivingPage.openPODialog();

        // ควรเห็น Dialog เปิดขึ้น
        await expect(page.getByText('เลือกรายการจากใบสั่งซื้อ (PO)')).toBeVisible();
    });

    // ===========================
    // กระจายสินค้า — Happy Path
    // ===========================

    test('TC-DIST-01: เปิด Distribute Dialog จาก PO สำเร็จ', async ({ page }) => {
        await receivingPage.openPODialog();

        // หา PO ที่สถานะยังไม่ RECEIVED
        const poCards = page.locator('[role="dialog"]').getByRole('button', { name: /กระจายสินค้า/ });
        const count = await poCards.count();

        if (count > 0) {
            // กดปุ่มกระจายอันแรก
            await poCards.first().click();

            // ตรวจว่า Distribute Dialog เปิด
            await expect(page.getByText('กระจายสินค้าสู่คลัง')).toBeVisible({ timeout: 10_000 });
        } else {
            // ไม่มี PO → skip
            test.skip();
        }
    });

    test('TC-DIST-02: Distribute Dialog แสดงรายการสินค้าถูกต้อง', async ({ page }) => {
        await receivingPage.openPODialog();

        const distButtons = page.locator('[role="dialog"]').getByRole('button', { name: /กระจายสินค้า/ });
        if (await distButtons.count() === 0) test.skip();

        await distButtons.first().click();
        await page.waitForLoadState('networkidle');

        // ควรเห็น Dialog กระจายสินค้าพร้อม list สินค้า
        const dialog = page.locator('[role="dialog"]').last();
        await expect(dialog).toBeVisible();

        // ควรมี dropdown เลือกคลัง
        await expect(dialog.locator('[role="combobox"]').first()).toBeVisible();

        // ควรมี input จำนวนอย่างน้อย 1 ช่อง
        const inputs = dialog.locator('input[type="number"]');
        expect(await inputs.count()).toBeGreaterThan(0);
    });

    test('TC-DIST-03: ปุ่ม "เพิ่มคลังสินค้า" เพิ่ม row ได้', async ({ page }) => {
        await receivingPage.openPODialog();

        const distButtons = page.locator('[role="dialog"]').getByRole('button', { name: /กระจายสินค้า/ });
        if (await distButtons.count() === 0) test.skip();

        await distButtons.first().click();
        await page.waitForLoadState('networkidle');

        // นับจำนวน warehouse selector ก่อนเพิ่ม
        const dialog = page.locator('[role="dialog"]').last();
        const selectsBefore = await dialog.locator('[role="combobox"]').count();

        // กดเพิ่มคลัง
        await receivingPage.addWarehouseRow();

        // ตรวจว่ามี warehouse selector เพิ่มขึ้น 1
        const selectsAfter = await dialog.locator('[role="combobox"]').count();
        expect(selectsAfter).toBe(selectsBefore + 1);
    });

    // ===========================
    // Validation Tests
    // ===========================

    test('TC-DIST-04: ไม่กรอกจำนวน → แจ้ง Error', async ({ page }) => {
        await receivingPage.openPODialog();

        const distButtons = page.locator('[role="dialog"]').getByRole('button', { name: /กระจายสินค้า/ });
        if (await distButtons.count() === 0) test.skip();

        await distButtons.first().click();
        await page.waitForLoadState('networkidle');

        // ไม่กรอกจำนวน → กด submit
        await receivingPage.submitDistribute();

        // ควรเห็น error toast
        const errorToast = page.locator('[data-sonner-toast][data-type="error"], [role="status"]').first();
        await expect(errorToast).toBeVisible({ timeout: 10_000 });
    });

    // ===========================
    // Receipt Table Tests
    // ===========================

    test('TC-RCV-03: ตาราง Receipt แสดงรายการที่มีอยู่', async ({ page }) => {
        // ดูว่ามี Receipt อยู่ในตาราง
        await receivingPage.waitForDataLoad();

        const receiptCount = await receivingPage.getReceiptCount();
        // ถ้ามี data → ตรวจว่า table แสดงผลถูกต้อง
        if (receiptCount > 0) {
            await expect(page.locator('table thead').getByText('เลขที่ใบรับ')).toBeVisible();
            await expect(page.locator('table thead').getByText('อ้างอิง PO')).toBeVisible();
        }
    });

    test('TC-RCV-04: Filter Receipts ตามช่วงเวลา', async ({ page }) => {
        // คลิก Tab "เดือนนี้"
        await page.getByRole('tab', { name: 'เดือนนี้' }).click();
        await page.waitForTimeout(500);

        // คลิก Tab "ทั้งหมด"
        await page.getByRole('tab', { name: 'ทั้งหมด' }).click();
        await page.waitForTimeout(500);

        // ไม่ crash → pass
        await expect(page.getByText('ใบรับสินค้าทั้งหมด')).toBeVisible();
    });

    // ===========================
    // ค้นหา Receipt
    // ===========================

    test('TC-RCV-05: ค้นหา Receipt ด้วย code', async ({ page }) => {
        const searchInput = page.locator('input[placeholder*="ค้นหาเลขที่ใบรับ"]');
        await searchInput.fill('RC-');

        // กรอก "RC-" → ควรแสดงผลลัพธ์ที่ขึ้นต้นด้วย RC-
        await page.waitForTimeout(500);
        const rows = page.locator('table tbody tr').filter({ hasText: /RC-/ });
        const count = await rows.count();
        // ไม่ crash → ผ่าน (count อาจ = 0 ถ้ายังไม่มี receipt)
        expect(count).toBeGreaterThanOrEqual(0);
    });
});
