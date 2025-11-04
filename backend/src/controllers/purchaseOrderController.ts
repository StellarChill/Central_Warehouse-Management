import { Request, Response } from 'express';
import prisma from '../prisma';

// Helper: ตรวจสอบรายละเอียด PO
function validateDetails(details: any[]) {
  if (!Array.isArray(details) || !details.length)
    throw new Error('details ต้องเป็น array ที่ไม่ว่าง');

  const seen = new Set<number>();

  for (const d of details) {
    const mid = Number(d.MaterialId);
    const qty = Number(d.PurchaseOrderQuantity);
    const price = Number(d.PurchaseOrderPrice);

    if (!mid || mid <= 0) throw new Error('MaterialId ต้องเป็นเลขบวก');
    if (!qty || qty <= 0) throw new Error('Quantity ต้องเป็นเลขบวก');
    if (price < 0 || isNaN(price)) throw new Error('Price ต้องเป็นเลข >= 0');
    if (!d.PurchaseOrderUnit) throw new Error('Unit ต้องระบุ');
    if (seen.has(mid)) throw new Error('ห้ามมี MaterialId ซ้ำ');
    seen.add(mid);
  }

  return details.map(d => ({
    MaterialId: Number(d.MaterialId),
    PurchaseOrderQuantity: Number(d.PurchaseOrderQuantity),
    PurchaseOrderPrice: Number(d.PurchaseOrderPrice),
    PurchaseOrderUnit: String(d.PurchaseOrderUnit),
  }));
}

// ✅ สร้างใบสั่งซื้อ
export async function createPurchaseOrder(req: Request, res: Response) {
  try {
    const { SupplierId, PurchaseOrderCode, details = [], ...rest } = req.body;
    if (!SupplierId || !PurchaseOrderCode)
      return res.status(400).json({ error: 'SupplierId และ PurchaseOrderCode จำเป็น' });

    const normalized = validateDetails(details);

    const [exists, supplier] = await Promise.all([
      prisma.purchaseOrder.findUnique({ where: { PurchaseOrderCode } }),
      prisma.supplier.findUnique({ where: { SupplierId: +SupplierId } }),
    ]);
    if (exists) return res.status(409).json({ error: 'รหัสซ้ำ' });
    if (!supplier) return res.status(400).json({ error: 'ไม่พบ supplier' });

    const matIds = normalized.map(d => d.MaterialId);
    const mats = await prisma.material.findMany({ where: { MaterialId: { in: matIds } } });
    if (mats.length !== matIds.length)
      return res.status(400).json({ error: 'มี MaterialId ที่ไม่ถูกต้อง' });

    const total = normalized.reduce(
      (sum, d) => sum + d.PurchaseOrderQuantity * d.PurchaseOrderPrice,
      0
    );

    const po = await prisma.purchaseOrder.create({
      data: {
        SupplierId: +SupplierId,
        PurchaseOrderCode,
        TotalPrice: total,
        PurchaseOrderStatus: rest.PurchaseOrderStatus || 'DRAFT',
        DateTime: rest.DateTime ? new Date(rest.DateTime) : new Date(),
        ...rest,
      },
    });

    await prisma.purchaseOrderDetail.createMany({
      data: normalized.map(d => ({
        ...d,
        PurchaseOrderId: po.PurchaseOrderId,
        CreatedBy: rest.CreatedBy,
      })),
    });

    const result = await prisma.purchaseOrder.findUnique({
      where: { PurchaseOrderId: po.PurchaseOrderId },
      include: {
        Supplier: { select: { SupplierId: true, SupplierName: true } },
        PurchaseOrderDetails: true,
      },
    });

    return res.status(201).json(result);
  } catch (e: any) {
    console.error(e);
    return res.status(400).json({ error: e.message || 'เกิดข้อผิดพลาด' });
  }
}

// ✅ ดึงรายการทั้งหมด
export async function listPurchaseOrders(_req: Request, res: Response) {
  try {
    const pos = await prisma.purchaseOrder.findMany({
      orderBy: { DateTime: 'desc' },
      include: { Supplier: { select: { SupplierName: true } } },
    });
    res.json(pos);
  } catch (e) {
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลได้' });
  }
}

// ✅ ดึงใบสั่งซื้อตาม ID
export async function getPurchaseOrder(req: Request, res: Response) {
  try {
    const id = +req.params.id;
    const po = await prisma.purchaseOrder.findUnique({
      where: { PurchaseOrderId: id },
      include: { Supplier: true, PurchaseOrderDetails: true },
    });
    if (!po) return res.status(404).json({ error: 'ไม่พบข้อมูล' });
    res.json(po);
  } catch {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
}

// ✅ อัปเดตใบสั่งซื้อ
export async function updatePurchaseOrder(req: Request, res: Response) {
  try {
    const id = +req.params.id;
    const { details, ...rest } = req.body;

    const data: any = { ...rest };
    if (rest.DateTime) data.DateTime = new Date(rest.DateTime);

    await prisma.$transaction(async (tx) => {
      if (details) {
        const normalized = validateDetails(details);
        await tx.purchaseOrderDetail.deleteMany({ where: { PurchaseOrderId: id } });
        await tx.purchaseOrderDetail.createMany({
          data: normalized.map(d => ({ ...d, PurchaseOrderId: id })),
        });
        data.TotalPrice = normalized.reduce(
          (sum, d) => sum + d.PurchaseOrderQuantity * d.PurchaseOrderPrice,
          0
        );
      }
      await tx.purchaseOrder.update({ where: { PurchaseOrderId: id }, data });
    });

    const updated = await prisma.purchaseOrder.findUnique({
      where: { PurchaseOrderId: id },
      include: { Supplier: true, PurchaseOrderDetails: true },
    });
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'อัปเดตไม่สำเร็จ' });
  }
}

// ✅ ลบใบสั่งซื้อ
export async function deletePurchaseOrder(req: Request, res: Response) {
  try {
    const id = +req.params.id;
    await prisma.$transaction(async (tx) => {
      await tx.purchaseOrderDetail.deleteMany({ where: { PurchaseOrderId: id } });
      await tx.purchaseOrder.delete({ where: { PurchaseOrderId: id } });
    });
    res.sendStatus(204);
  } catch {
    res.status(404).json({ error: 'ไม่พบหรือไม่สามารถลบได้' });
  }
}

// ✅ อัปเดตสถานะใบสั่งซื้อ
export async function updatePurchaseOrderStatus(req: Request, res: Response) {
  try {
    const id = +req.params.id;
    const { PurchaseOrderStatus } = req.body;

    if (!PurchaseOrderStatus)
      return res.status(400).json({ error: 'ต้องระบุสถานะใหม่' });

    const po = await prisma.purchaseOrder.findUnique({ where: { PurchaseOrderId: id } });
    if (!po) return res.status(404).json({ error: 'ไม่พบใบสั่งซื้อ' });

    const updated = await prisma.purchaseOrder.update({
      where: { PurchaseOrderId: id },
      data: { PurchaseOrderStatus },
    });

    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'ไม่สามารถอัปเดตสถานะได้' });
  }
}
