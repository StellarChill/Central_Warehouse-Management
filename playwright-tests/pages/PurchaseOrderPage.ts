import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * PurchaseOrderPage POM — จัดการหน้าใบสั่งซื้อ (PO)
 */
export class PurchaseOrderPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    async goto() {
        await this.navigateTo('/purchase-orders');
    }

    /** กดปุ่ม "สร้างใบสั่งซื้อ" */
    async clickCreatePO() {
        await this.page.getByRole('button', { name: /สร้างใบสั่งซื้อ/ }).click();
        // รอ Dialog เปิด
        await this.page.locator('[role="dialog"]').waitFor({ state: 'visible' });
    }

    /** เลือก Supplier จาก dropdown */
    async selectSupplier(supplierName: string) {
        // คลิก trigger ที่มี placeholder "เลือก Supplier"
        const trigger = this.page.locator('[role="dialog"]').getByRole('combobox').first();
        await trigger.click();
        await this.page.getByRole('option', { name: new RegExp(supplierName, 'i') }).click();
    }

    /** เลือก Warehouse ปลายทาง (ถ้ามี) */
    async selectTargetWarehouse(warehouseName: string) {
        const whSelect = this.page.locator('[role="dialog"]').getByRole('combobox').nth(1);
        if (await whSelect.isVisible()) {
            await whSelect.click();
            await this.page.getByRole('option', { name: new RegExp(warehouseName, 'i') }).click();
        }
    }

    /** เลือก checkbox สินค้าในตาราง */
    async selectMaterial(materialName: string) {
        const row = this.page.locator('[role="dialog"] table tbody tr').filter({ hasText: materialName });
        await row.locator('input[type="checkbox"], [role="checkbox"]').first().click();
    }

    /** ตั้ง quantity สำหรับ material ที่เลือก */
    async setMaterialQuantity(materialName: string, qty: number) {
        const row = this.page.locator('[role="dialog"] table tbody tr').filter({ hasText: materialName });
        const input = row.locator('input[type="number"]').first();
        await input.clear();
        await input.fill(String(qty));
    }

    /** กด Submit สร้าง PO */
    async submitCreatePO() {
        await this.page.locator('[role="dialog"]').getByRole('button', { name: /บันทึก|สร้าง|ยืนยัน/ }).click();
    }

    /** ยืนยันว่ามี PO code ปรากฏในตาราง */
    async verifyPOExists(poCode: string) {
        await expect(this.page.locator('table').getByText(poCode)).toBeVisible({ timeout: 10_000 });
    }

    /** ดึง PO code ล่าสุดจากตาราง (แถวแรก) */
    async getLatestPOCode(): Promise<string> {
        await this.page.waitForTimeout(1000);
        const firstRow = this.page.locator('table tbody tr').first();
        const codeCell = firstRow.locator('td').first();
        const text = await codeCell.innerText();
        // Extract PO code (PO-YYYYMM-XXXX pattern)
        const match = text.match(/PO-\d{6}-\d{4}/);
        return match ? match[0] : text.trim();
    }

    /** ดู status badge ของ PO */
    async verifyPOStatus(poCode: string, status: string) {
        const row = this.page.locator('table tbody tr').filter({ hasText: poCode });
        await expect(row.locator('.badge, [class*="Badge"]')).toContainText(status);
    }
}
