import { Request, Response } from 'express';
import prisma from '../prisma';
import { getCompanyId, httpError } from '../utils/context';

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

// สร้างโค้ดรันนิ่งรายวัน: PO-YYYYMMDD-0001
async function generatePurchaseOrderCode() {
  const pad4 = (n: number) => n.toString().padStart(4, '0');
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const dateStr = `${y}${m}${day}`;
  const prefix = `PO-${dateStr}-`;
  const last = await prisma.purchaseOrder.findFirst({
    where: { PurchaseOrderCode: { startsWith: prefix } },
    orderBy: { PurchaseOrderCode: 'desc' },
    select: { PurchaseOrderCode: true },
  });
  const next = last ? Number(last.PurchaseOrderCode.split('-').pop() || '0') + 1 : 1;
  return `${prefix}${pad4(next)}`;
}

// ✅ สร้างใบสั่งซื้อ
export async function createPurchaseOrder(req: Request, res: Response) {
  try {
    const CompanyId = getCompanyId(req, true)!;
    const { SupplierId, details = [], ...rest } = req.body;
    if (!SupplierId)
      return res.status(400).json({ error: 'SupplierId จำเป็น' });

    const normalized = validateDetails(details);

    const supplier = await prisma.supplier.findFirst({ where: { SupplierId: +SupplierId, CompanyId } });
    if (!supplier) return res.status(400).json({ error: 'ไม่พบ supplier' });

    const matIds = normalized.map(d => d.MaterialId);
    const mats = await prisma.material.findMany({ where: { MaterialId: { in: matIds }, CompanyId } });
    if (mats.length !== matIds.length)
      return res.status(400).json({ error: 'มี MaterialId ที่ไม่ถูกต้อง' });

    const total = normalized.reduce(
      (sum, d) => sum + d.PurchaseOrderQuantity * d.PurchaseOrderPrice,
      0
    );

    // Generate running code (retry once if collision)
    let code = await generatePurchaseOrderCode();
    let po;
    try {
      po = await prisma.purchaseOrder.create({
        data: {
          CompanyId,
          SupplierId: +SupplierId,
          PurchaseOrderCode: code,
          TotalPrice: total,
          PurchaseOrderStatus: rest.PurchaseOrderStatus || 'DRAFT',
          DateTime: rest.DateTime ? new Date(rest.DateTime) : new Date(),
          ...rest,
        },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        code = await generatePurchaseOrderCode();
        po = await prisma.purchaseOrder.create({
          data: {
            CompanyId,
            SupplierId: +SupplierId,
            PurchaseOrderCode: code,
            TotalPrice: total,
            PurchaseOrderStatus: rest.PurchaseOrderStatus || 'DRAFT',
            DateTime: rest.DateTime ? new Date(rest.DateTime) : new Date(),
            ...rest,
          },
        });
      } else {
        throw e;
      }
    }

    await prisma.purchaseOrderDetail.createMany({
      data: normalized.map(d => ({
        ...d,
        PurchaseOrderId: po.PurchaseOrderId,
        CompanyId,
        CreatedBy: rest.CreatedBy,
      })),
    });

    const result = await prisma.purchaseOrder.findUnique({
      where: { PurchaseOrderId: po.PurchaseOrderId },
      include: {
        Supplier: { select: { SupplierName: true } },
        _count: {
          select: { PurchaseOrderDetails: true },
        },
        CreatedByUser: {
          select: { UserName: true },
        },
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
    const CompanyId = getCompanyId(_req as any, true)!;
    const pos = await prisma.purchaseOrder.findMany({
      where: { CompanyId },
      orderBy: { DateTime: 'desc' },
      include: { 
        Supplier: { select: { SupplierName: true } },
        _count: {
          select: { PurchaseOrderDetails: true },
        },
        CreatedByUser: {
          select: { UserName: true },
        },
      },
    });
    res.json(pos);
  } catch (e) {
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลได้' });
  }
}

// ✅ ดึงใบสั่งซื้อตาม ID
export async function getPurchaseOrder(req: Request, res: Response) {
  try {
    const CompanyId = getCompanyId(req, true)!;
    const id = +req.params.id;
    const po = await prisma.purchaseOrder.findFirst({
      where: { PurchaseOrderId: id, CompanyId },
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
    const CompanyId = getCompanyId(req, true)!;
    const id = +req.params.id;
    const { details, ...rest } = req.body;

    const data: any = { ...rest };
    if (rest.DateTime) data.DateTime = new Date(rest.DateTime);

    const existed = await prisma.purchaseOrder.findFirst({ where: { PurchaseOrderId: id, CompanyId } });
    if (!existed) throw httpError(404, 'Not found');

    await prisma.$transaction(async (tx) => {
      if (details) {
        const normalized = validateDetails(details);
        await tx.purchaseOrderDetail.deleteMany({ where: { PurchaseOrderId: id } });
        await tx.purchaseOrderDetail.createMany({
            data: normalized.map(d => ({ ...d, PurchaseOrderId: id, CompanyId })),
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
    const CompanyId = getCompanyId(req, true)!;
    const id = +req.params.id;
    const existed = await prisma.purchaseOrder.findFirst({ where: { PurchaseOrderId: id, CompanyId } });
    if (!existed) return res.status(404).json({ error: 'ไม่พบหรือไม่สามารถลบได้' });
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
