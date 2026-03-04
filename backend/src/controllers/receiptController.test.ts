import { Request, Response } from 'express';
import { distributeReceipt } from './receiptController';
import prisma from '../prisma';

// Helper: ให้ TypeScript ใช้ type ที่ mock ได้
const prismaMock = prisma as any;

// ==========================================
// Helper: สร้าง mock Request / Response
// ==========================================
function buildMockRes() {
    let captured: any = {};
    const res: Partial<Response> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((body) => {
            captured = body;
            return res;
        }),
        send: jest.fn().mockReturnThis(),
    };
    return { res: res as Response, getCaptured: () => captured };
}

function buildMockReq(body: any): Request {
    return {
        user: { CompanyId: 1, UserId: 99 },
        body,
        headers: {},
        query: {},
    } as any;
}

// ==========================================
// Tests
// ==========================================
describe('distributeReceipt', () => {

    // ────────────────────────────────────────
    // Test 1: สร้างการกระจายสินค้าสำเร็จ
    // ────────────────────────────────────────
    it('ควรสร้างใบรับสินค้าสำเร็จ เมื่อกระจายไป 2 คลัง', async () => {
        const { res, getCaptured } = buildMockRes();

        const req = buildMockReq({
            PurchaseOrderId: 100,
            distributions: [
                { WarehouseId: 1, items: [{ MaterialId: 10, MaterialQuantity: 5 }] },
                { WarehouseId: 2, items: [{ MaterialId: 10, MaterialQuantity: 3 }] },
            ],
        });

        // Mock: PO exists
        prismaMock.purchaseOrder.findFirst.mockResolvedValue({ PurchaseOrderId: 100, CompanyId: 1 });

        // Mock: Both warehouses exist
        prismaMock.warehouse.findFirst
            .mockResolvedValueOnce({ WarehouseId: 1, CompanyId: 1 })
            .mockResolvedValueOnce({ WarehouseId: 2, CompanyId: 1 });

        // Mock: PO Details (สั่ง 10 ชิ้น ราคา 100)
        prismaMock.purchaseOrderDetail.findMany.mockResolvedValue([
            { PurchaseOrderDetailId: 500, MaterialId: 10, PurchaseOrderPrice: 100, PurchaseOrderQuantity: 10 },
        ]);

        // Mock: ยังไม่เคยรับเลย
        prismaMock.receiptDetail.groupBy.mockResolvedValue([]);

        // Mock: generateReceiptCode → findMany + findFirst
        prismaMock.receipt.findMany.mockResolvedValue([]); // ไม่มี code ก่อนหน้า
        prismaMock.receipt.findFirst.mockResolvedValue(null); // candidate ไม่ซ้ำ

        // Mock: receipt.create → return id
        let receiptSeq = 0;
        prismaMock.receipt.create.mockImplementation(async () => {
            receiptSeq++;
            return { ReceiptId: receiptSeq, ReceiptCode: `RC-20260304-000${receiptSeq}` };
        });

        // Mock: createMany
        prismaMock.receiptDetail.createMany.mockResolvedValue({ count: 1 });
        prismaMock.stock.createMany.mockResolvedValue({ count: 1 });

        await distributeReceipt(req, res);

        // Assert: ส่ง 201 สำเร็จ
        expect(res.status).toHaveBeenCalledWith(201);

        const body = getCaptured();
        expect(body.totalWarehouses).toBe(2);
        expect(body.receipts).toHaveLength(2);
        expect(body.receipts[0]).toHaveProperty('ReceiptCode');

        // Assert: สร้าง receipt 2 ครั้ง (คลังละ 1)
        expect(prismaMock.receipt.create).toHaveBeenCalledTimes(2);

        // Assert: สร้าง stock 2 ครั้ง
        expect(prismaMock.stock.createMany).toHaveBeenCalledTimes(2);
    });

    // ────────────────────────────────────────
    // Test 2: จำนวนรวมเกิน PO → 400
    // ────────────────────────────────────────
    it('ควรส่ง Error 400 เมื่อจำนวนรวมเกิน PO', async () => {
        const { res, getCaptured } = buildMockRes();

        // สั่ง 10 แต่แจก 7 + 5 = 12 → เกิน
        const req = buildMockReq({
            PurchaseOrderId: 100,
            distributions: [
                { WarehouseId: 1, items: [{ MaterialId: 10, MaterialQuantity: 7 }] },
                { WarehouseId: 2, items: [{ MaterialId: 10, MaterialQuantity: 5 }] },
            ],
        });

        prismaMock.purchaseOrder.findFirst.mockResolvedValue({ PurchaseOrderId: 100, CompanyId: 1 });
        prismaMock.warehouse.findFirst
            .mockResolvedValueOnce({ WarehouseId: 1, CompanyId: 1 })
            .mockResolvedValueOnce({ WarehouseId: 2, CompanyId: 1 });

        // PO มีแค่ 10
        prismaMock.purchaseOrderDetail.findMany.mockResolvedValue([
            { PurchaseOrderDetailId: 500, MaterialId: 10, PurchaseOrderPrice: 100, PurchaseOrderQuantity: 10 },
        ]);
        prismaMock.receiptDetail.groupBy.mockResolvedValue([]);

        await distributeReceipt(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        const body = getCaptured();
        expect(body.error).toContain('Receive exceeds PO');
    });

    // ────────────────────────────────────────
    // Test 3: Warehouse ไม่พบ → 400
    // ────────────────────────────────────────
    it('ควรส่ง Error 400 เมื่อไม่พบ Warehouse', async () => {
        const { res, getCaptured } = buildMockRes();

        const req = buildMockReq({
            PurchaseOrderId: 100,
            distributions: [
                { WarehouseId: 999, items: [{ MaterialId: 10, MaterialQuantity: 5 }] },
            ],
        });

        prismaMock.purchaseOrder.findFirst.mockResolvedValue({ PurchaseOrderId: 100, CompanyId: 1 });
        // ❌ Warehouse 999 ไม่มี
        prismaMock.warehouse.findFirst.mockResolvedValue(null);

        await distributeReceipt(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        const body = getCaptured();
        expect(body.error).toContain('ไม่พบ Warehouse ID');
    });

    // ────────────────────────────────────────
    // Test 4: ไม่ส่ง distributions → 400
    // ────────────────────────────────────────
    it('ควรส่ง Error 400 เมื่อ distributions ว่าง', async () => {
        const { res, getCaptured } = buildMockRes();

        const req = buildMockReq({
            PurchaseOrderId: 100,
            distributions: [],
        });

        await distributeReceipt(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        const body = getCaptured();
        expect(body.error).toContain('distributions must be a non-empty array');
    });

    // ────────────────────────────────────────
    // Test 5: ไม่ส่ง PurchaseOrderId → 400
    // ────────────────────────────────────────
    it('ควรส่ง Error 400 เมื่อไม่ระบุ PurchaseOrderId', async () => {
        const { res, getCaptured } = buildMockRes();

        const req = buildMockReq({
            distributions: [
                { WarehouseId: 1, items: [{ MaterialId: 10, MaterialQuantity: 5 }] },
            ],
        });

        await distributeReceipt(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        const body = getCaptured();
        expect(body.error).toContain('PurchaseOrderId is required');
    });

    // ────────────────────────────────────────
    // Test 6: PO ไม่พบ → 400
    // ────────────────────────────────────────
    it('ควรส่ง Error 400 เมื่อไม่พบ PO', async () => {
        const { res, getCaptured } = buildMockRes();

        const req = buildMockReq({
            PurchaseOrderId: 9999,
            distributions: [
                { WarehouseId: 1, items: [{ MaterialId: 10, MaterialQuantity: 5 }] },
            ],
        });

        prismaMock.purchaseOrder.findFirst.mockResolvedValue(null);

        await distributeReceipt(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        const body = getCaptured();
        expect(body.error).toContain('PurchaseOrder not found');
    });

    // ────────────────────────────────────────
    // Test 7: สินค้ามีบางส่วนรับไปแล้ว → รับเพิ่มได้ตาม remaining
    // ────────────────────────────────────────
    it('ควรรับได้เฉพาะจำนวนคงเหลือ เมื่อมีการรับไปแล้วบางส่วน', async () => {
        const { res, getCaptured } = buildMockRes();

        // PO สั่ง 10, รับไปแล้ว 6, คงเหลือ 4
        // แจก: คลัง1=2, คลัง2=2 → รวม 4 ✅ พอดี
        const req = buildMockReq({
            PurchaseOrderId: 100,
            distributions: [
                { WarehouseId: 1, items: [{ MaterialId: 10, MaterialQuantity: 2 }] },
                { WarehouseId: 2, items: [{ MaterialId: 10, MaterialQuantity: 2 }] },
            ],
        });

        prismaMock.purchaseOrder.findFirst.mockResolvedValue({ PurchaseOrderId: 100, CompanyId: 1 });
        prismaMock.warehouse.findFirst
            .mockResolvedValueOnce({ WarehouseId: 1, CompanyId: 1 })
            .mockResolvedValueOnce({ WarehouseId: 2, CompanyId: 1 });

        prismaMock.purchaseOrderDetail.findMany.mockResolvedValue([
            { PurchaseOrderDetailId: 500, MaterialId: 10, PurchaseOrderPrice: 100, PurchaseOrderQuantity: 10 },
        ]);

        // รับไปแล้ว 6
        prismaMock.receiptDetail.groupBy.mockResolvedValue([
            { MaterialId: 10, _sum: { MaterialQuantity: 6 } },
        ]);

        prismaMock.receipt.findMany.mockResolvedValue([]);
        prismaMock.receipt.findFirst.mockResolvedValue(null);
        let receiptSeq = 0;
        prismaMock.receipt.create.mockImplementation(async () => {
            receiptSeq++;
            return { ReceiptId: receiptSeq, ReceiptCode: `RC-20260304-000${receiptSeq}` };
        });
        prismaMock.receiptDetail.createMany.mockResolvedValue({ count: 1 });
        prismaMock.stock.createMany.mockResolvedValue({ count: 1 });

        await distributeReceipt(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(getCaptured().totalWarehouses).toBe(2);
    });

    // ────────────────────────────────────────
    // Test 8: รับบางส่วนไปแล้ว + แจกเกิน remaining → 400
    // ────────────────────────────────────────
    it('ควรส่ง Error 400 เมื่อรับไปแล้วบางส่วน แล้วแจกเกิน remaining', async () => {
        const { res, getCaptured } = buildMockRes();

        // PO สั่ง 10, รับไปแล้ว 6, remaining = 4
        // แจก: คลัง1=3, คลัง2=3 → รวม 6 > remaining 4 → เกิน
        const req = buildMockReq({
            PurchaseOrderId: 100,
            distributions: [
                { WarehouseId: 1, items: [{ MaterialId: 10, MaterialQuantity: 3 }] },
                { WarehouseId: 2, items: [{ MaterialId: 10, MaterialQuantity: 3 }] },
            ],
        });

        prismaMock.purchaseOrder.findFirst.mockResolvedValue({ PurchaseOrderId: 100, CompanyId: 1 });
        prismaMock.warehouse.findFirst
            .mockResolvedValueOnce({ WarehouseId: 1, CompanyId: 1 })
            .mockResolvedValueOnce({ WarehouseId: 2, CompanyId: 1 });

        prismaMock.purchaseOrderDetail.findMany.mockResolvedValue([
            { PurchaseOrderDetailId: 500, MaterialId: 10, PurchaseOrderPrice: 100, PurchaseOrderQuantity: 10 },
        ]);

        // รับไปแล้ว 6
        prismaMock.receiptDetail.groupBy.mockResolvedValue([
            { MaterialId: 10, _sum: { MaterialQuantity: 6 } },
        ]);

        await distributeReceipt(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(getCaptured().error).toContain('Receive exceeds PO');
    });
});
