import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * ReceivingPage POM — จัดการหน้ารับสินค้า + กระจายสินค้า
 */
export class ReceivingPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    async goto() {
        await this.navigateTo('/receiving');
    }

    // ===========================
    // PO Dialog (เลือกรายการจาก PO)
    // ===========================

    /** เปิด PO Dialog โดยกดปุ่ม "รับสินค้าจาก PO" */
    async openPODialog() {
        await this.page.getByRole('button', { name: /รับสินค้าจาก PO/ }).click();
        // รอ Dialog เปิดเสร็จ
        await this.page.locator('[role="dialog"]').waitFor({ state: 'visible' });
        await this.waitForDataLoad();
    }

    /** เปิด PO Dialog โดยคลิกที่ Card "PO รอรับของ" */
    async openPODialogViaCard() {
        await this.page.getByText('PO รอรับของ').click();
        await this.page.locator('[role="dialog"]').waitFor({ state: 'visible' });
        await this.waitForDataLoad();
    }

    /** ตรวจว่า PO code ปรากฏใน PO Dialog */
    async verifyPOVisibleInDialog(poCode: string) {
        const dialog = this.page.locator('[role="dialog"]');
        await expect(dialog.getByText(poCode)).toBeVisible({ timeout: 10_000 });
    }

    /** ตรวจว่า PO code ไม่อยู่ใน PO Dialog (รับครบแล้ว/RECEIVED) */
    async verifyPONotInDialog(poCode: string) {
        const dialog = this.page.locator('[role="dialog"]');
        await expect(dialog.getByText(poCode)).not.toBeVisible({ timeout: 5000 });
    }

    // ===========================
    // กระจายสินค้า
    // ===========================

    /** กดปุ่ม "กระจายสินค้า" ที่ PO code ที่ระบุ */
    async clickDistribute(poCode: string) {
        const poCard = this.page.locator('[role="dialog"]').locator('div').filter({ hasText: poCode }).first();
        // หาปุ่มกระจายสินค้าภายใน PO card
        const distributeBtn = poCard.locator('..').locator('..').getByRole('button', { name: /กระจายสินค้า/ });
        await distributeBtn.click();
        // รอ distribute dialog เปิด
        await this.page.locator('text=กระจายสินค้าสู่คลัง').waitFor({ state: 'visible', timeout: 10_000 });
    }

    // ===========================
    // Distribute Dialog
    // ===========================

    /** เลือก Warehouse สำหรับ distribution row ที่ N (0-indexed) */
    async selectDistributeWarehouse(rowIndex: number, warehouseName: string) {
        // หา select trigger ตัวที่ rowIndex ใน distribute dialog
        const selects = this.page.locator('[role="dialog"]').last().locator('[role="combobox"]');
        await selects.nth(rowIndex).click();
        await this.page.getByRole('option', { name: new RegExp(warehouseName, 'i') }).click();
    }

    /** กรอกจำนวนสินค้าใน distribute dialog */
    async setDistributeQuantity(rowIndex: number, materialName: string, qty: number) {
        const distributeDialog = this.page.locator('[role="dialog"]').last();
        // หา card ของ warehouse row ที่ rowIndex
        const warehouseCards = distributeDialog.locator('[class*="border-slate-200"]');
        const card = warehouseCards.nth(rowIndex);
        // หา row ของ material
        const materialRow = card.locator('tr, div').filter({ hasText: materialName });
        const input = materialRow.locator('input[type="number"]').first();
        await input.clear();
        await input.fill(String(qty));
    }

    /** กดปุ่ม "+ เพิ่มคลังสินค้า" */
    async addWarehouseRow() {
        const dialog = this.page.locator('[role="dialog"]').last();
        await dialog.getByRole('button', { name: /เพิ่มคลัง/ }).click();
    }

    /** กดปุ่ม "เติมที่เหลือทั้งหมด" ของ warehouse row ที่ N */
    async autoFill(rowIndex: number) {
        const dialog = this.page.locator('[role="dialog"]').last();
        const fillButtons = dialog.getByRole('button', { name: /เติมที่เหลือ/ });
        await fillButtons.nth(rowIndex).click();
    }

    /** กดปุ่ม Submit กระจายสินค้า */
    async submitDistribute() {
        const dialog = this.page.locator('[role="dialog"]').last();
        await dialog.getByRole('button', { name: /บันทึกรับ.*กระจาย/ }).click();
    }

    /** ตรวจสอบว่า material ไม่แสดงใน distribute dialog (remaining = 0) */
    async verifyMaterialNotInDistributeDialog(materialName: string) {
        const dialog = this.page.locator('[role="dialog"]').last();
        // เช็คใน distribution table/rows — ไม่ควรมี input สำหรับ material นี้
        const materialInputRow = dialog.locator('input[type="number"]').locator('..').filter({ hasText: materialName });
        await expect(materialInputRow).toHaveCount(0);
    }

    /** อ่าน remaining ของ material จาก PO Summary bar ใน distribute dialog */
    async getDistributeRemaining(materialName: string): Promise<string> {
        const dialog = this.page.locator('[role="dialog"]').last();
        const summaryRow = dialog.getByText(materialName).locator('..');
        return summaryRow.innerText();
    }

    // ===========================
    // Receipts Table
    // ===========================

    /** นับจำนวน receipt ในตาราง */
    async getReceiptCount(): Promise<number> {
        await this.waitForDataLoad();
        const rows = this.page.locator('table tbody tr').filter({ hasText: /RC-/ });
        return rows.count();
    }

    /** ตรวจว่ามี receipt code ในตาราง */
    async verifyReceiptExists(receiptCode: string) {
        await expect(this.page.locator('table').getByText(receiptCode)).toBeVisible({ timeout: 10_000 });
    }

    // ===========================
    // Standard Receipt (รับปกติ)
    // ===========================

    /** เลือก checkbox สินค้าใน PO Dialog */
    async selectItemInPODialog(materialName: string) {
        const dialog = this.page.locator('[role="dialog"]');
        const row = dialog.locator('tr').filter({ hasText: materialName });
        await row.locator('[role="checkbox"], input[type="checkbox"]').first().click();
    }

    /** กดปุ่ม "บันทึกรับสินค้า" ใน PO Dialog */
    async submitStandardReceipt() {
        const dialog = this.page.locator('[role="dialog"]');
        await dialog.getByRole('button', { name: /บันทึกรับสินค้า/ }).click();
    }
}
