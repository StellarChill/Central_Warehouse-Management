import { Request, Response } from 'express';
import prisma from '../prisma';
import { getCompanyId, getWarehouseId } from '../utils/context';

// ---------- Helpers ----------
type NormalizedDetail = { MaterialId: number; MaterialQuantity: number };
type PoDetailEntry = { podId: number; price: number; orderedQty: number };

const poSelect = { PurchaseOrderId: true, PurchaseOrderCode: true } as const;
const includeReceipt = { PurchaseOrder: { select: poSelect }, ReceiptDetails: true } as const;

function httpError(status: number, message: string) {
  const err = new Error(message) as any;
  err.status = status;
  return err;
}

function parseDetails(details: any): NormalizedDetail[] {
  if (!Array.isArray(details) || details.length === 0) throw httpError(400, 'details must be a non-empty array');
  const seen = new Set<number>();
  const out: NormalizedDetail[] = [];
  for (const d of details) {
    const MaterialId = Number(d?.MaterialId);
    const MaterialQuantity = Number(d?.MaterialQuantity);
    if (!Number.isFinite(MaterialId) || MaterialId <= 0) throw httpError(400, 'MaterialId must be a positive number');
    if (!Number.isFinite(MaterialQuantity) || MaterialQuantity <= 0) throw httpError(400, 'MaterialQuantity must be a positive number');
    if (seen.has(MaterialId)) throw httpError(400, 'Duplicate MaterialId in details is not allowed');
    seen.add(MaterialId);
    out.push({ MaterialId, MaterialQuantity });
  }
  return out;
}

async function getPoDetailMap(companyId: number, poId: number, materialIds: number[]) {
  const pods = await prisma.purchaseOrderDetail.findMany({
    where: { CompanyId: companyId, PurchaseOrderId: poId, MaterialId: { in: materialIds } },
    select: { PurchaseOrderDetailId: true, MaterialId: true, PurchaseOrderPrice: true, PurchaseOrderQuantity: true },
  });
  if (pods.length !== new Set(materialIds).size) {
    throw httpError(400, 'One or more materials are not in the referenced Purchase Order');
  }
  const map = new Map<number, PoDetailEntry>();
  for (const p of pods) map.set(p.MaterialId, { podId: p.PurchaseOrderDetailId, price: p.PurchaseOrderPrice, orderedQty: p.PurchaseOrderQuantity });
  return map;
}

function computeTotal(details: NormalizedDetail[], map: Map<number, PoDetailEntry>) {
  return details.reduce((sum, d) => sum + d.MaterialQuantity * (map.get(d.MaterialId)?.price ?? 0), 0);
}

async function getReceivedSumMap(companyId: number, poId: number, materialIds: number[], excludeReceiptId?: number) {
  // Sum of received quantities per material for the given PO, optionally excluding one receipt (for update case)
  const where: any = {
    MaterialId: { in: materialIds },
    CompanyId: companyId,
    Receipt: { PurchaseOrderId: poId },
  };
  if (excludeReceiptId) {
    where.Receipt.NOT = { ReceiptId: excludeReceiptId };
  }

  // Use groupBy to sum quantities per material
  const rows = await (prisma as any).receiptDetail.groupBy({
    by: ['MaterialId'],
    where,
    _sum: { MaterialQuantity: true },
  });
  const map = new Map<number, number>();
  for (const r of rows) map.set(r.MaterialId, Number(r._sum.MaterialQuantity ?? 0));
  return map;
}

// Validate details do not exceed PO remaining quantities and return map + total
async function enforceNotExceed(companyId: number, poId: number, details: NormalizedDetail[], excludeReceiptId?: number) {
  const matIds = details.map(d => d.MaterialId);
  const map = await getPoDetailMap(companyId, poId, matIds);
  const receivedMap = await getReceivedSumMap(companyId, poId, matIds, excludeReceiptId);
  const violations: string[] = [];
  for (const d of details) {
    const ordered = map.get(d.MaterialId)!.orderedQty;
    const received = receivedMap.get(d.MaterialId) ?? 0;
    const remaining = ordered - received;
    if (d.MaterialQuantity > remaining) violations.push(`MaterialId ${d.MaterialId}: remaining ${remaining}`);
  }
  if (violations.length) throw httpError(400, `Receive exceeds PO for: ${violations.join(', ')}`);
  return { map, total: computeTotal(details, map) };
}

function flattenReceipt(r: any) {
  const { PurchaseOrder, ...rest } = r;
  return {
    ...rest,
    PurchaseOrderId: PurchaseOrder?.PurchaseOrderId ?? rest.PurchaseOrderId,
    PurchaseOrderCode: PurchaseOrder?.PurchaseOrderCode,
  };
}

function handleError(res: Response, e: any) {
  console.error(e);
  if (e?.status) return res.status(e.status).json({ error: e.message });
  if (e?.code === 'P2002') return res.status(409).json({ error: 'Duplicate receipt code' });
  if (e?.code === 'P2025') return res.status(404).json({ error: 'Not found' });
  return res.status(500).json({ error: 'Internal server error' });
}

function genBarcode(receiptCode: string, materialId: number, idx: number) {
  // Unique enough: RC-CODE-MID-idx-yyyymmddHHMMssms
  const ts = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const stamp = `${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}${ts.getMilliseconds()}`;
  return `${receiptCode}-${materialId}-${idx}-${stamp}`;
}

// Generate daily running code per Company: RC-YYYYMMDD-XXXX
// Generate daily running code per Company: RC-YYYYMMDD-XXXX (Robust Check)
async function generateReceiptCode(companyId: number, tx: any = prisma) {
  const pad4 = (n: number) => n.toString().padStart(4, '0');
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const dateStr = `${y}${m}${day}`;
  const prefix = `RC-${dateStr}-`;

  // Check existing within this prefix
  const existing = await tx.receipt.findMany({
    where: { ReceiptCode: { startsWith: prefix } }, // Global Unique Check
    select: { ReceiptCode: true }
  });

  let maxNum = 0;
  for (const r of existing) {
    const parts = r.ReceiptCode.split('-');
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num) && num > maxNum) maxNum = num;
  }

  // Find next available slot
  let nextNum = maxNum + 1;
  while (true) {
    const candidate = `${prefix}${pad4(nextNum)}`;
    const exists = await tx.receipt.findFirst({ where: { ReceiptCode: candidate } });
    if (!exists) return candidate;
    nextNum++;
    if (nextNum > 9999) throw new Error('Receipt running number exhausted for today');
  }
}

// Create Receipt from a PO
// Create Receipt from a PO
export async function createReceipt(req: Request, res: Response) {
  try {
    const CompanyId = getCompanyId(req, true)!;
    const WarehouseId = getWarehouseId(req, true)!;
    const { PurchaseOrderId, ReceiptDateTime, details, CreatedBy } = req.body;
    if (!PurchaseOrderId) throw httpError(400, 'PurchaseOrderId is required');

    const normalized = parseDetails(details);
    const poId = Number(PurchaseOrderId);

    const po = await prisma.purchaseOrder.findFirst({ where: { PurchaseOrderId: poId, CompanyId } });
    if (!po) throw httpError(400, 'PurchaseOrder not found');

    const { map, total } = await enforceNotExceed(CompanyId, poId, normalized);
    const rdt = ReceiptDateTime ? new Date(ReceiptDateTime) : new Date();

    // Logic wrapped in retry loop for concurrency safety
    let receipt;
    let attempts = 0;
    while (attempts < 5) {
      try {
        receipt = await prisma.$transaction(async (tx) => {
          // 1. Generate unique code
          const code = await generateReceiptCode(CompanyId, tx);

          // 2. Create Receipt Header
          const createdReceipt = await tx.receipt.create({
            data: { CompanyId, PurchaseOrderId: poId, ReceiptCode: code, ReceiptDateTime: rdt, ReceiptTotalPrice: total, CreatedBy },
          });

          // 3. Create Details
          await tx.receiptDetail.createMany({
            data: normalized.map(d => ({
              CompanyId,
              WarehouseId,
              ReceiptId: createdReceipt.ReceiptId,
              PurchaseOrderDetailId: map.get(d.MaterialId)!.podId,
              MaterialId: d.MaterialId,
              MaterialQuantity: d.MaterialQuantity,
              CreatedBy,
            })),
          });

          // 4. Create Stock Rows
          await tx.stock.createMany({
            data: normalized.map((d, i) => ({
              CompanyId,
              WarehouseId,
              MaterialId: d.MaterialId,
              Quantity: d.MaterialQuantity,
              Barcode: genBarcode(code, d.MaterialId, i + 1),
              StockPrice: map.get(d.MaterialId)!.price,
              ReceiptId: createdReceipt.ReceiptId,
              PurchaseOrderId: poId,
              Issue: 0,
              Remain: d.MaterialQuantity,
              CreatedBy: CreatedBy,
            })),
          });

          return createdReceipt;
        });
        break; // Success
      } catch (e: any) {
        if (e?.code === 'P2002') {
          console.warn('Receipt Duplicate Code Retry...');
          attempts++;
          continue;
        }
        throw e;
      }
    }

    if (!receipt) throw new Error('Failed to create receipt after multiple attempts');

    // Post-creation: Update PO Status if fully received
    try {
      const allPods = await prisma.purchaseOrderDetail.findMany({
        where: { CompanyId, PurchaseOrderId: receipt.PurchaseOrderId },
        select: { MaterialId: true, PurchaseOrderQuantity: true },
      });
      const matIds = allPods.map((p) => p.MaterialId);
      if (matIds.length) {
        const receivedMap = await getReceivedSumMap(CompanyId, receipt.PurchaseOrderId, matIds);
        const allDone = allPods.every((p) => (receivedMap.get(p.MaterialId) ?? 0) >= p.PurchaseOrderQuantity);
        if (allDone) {
          await prisma.purchaseOrder.update({
            where: { PurchaseOrderId: receipt.PurchaseOrderId },
            data: { PurchaseOrderStatus: 'RECEIVED' },
          });
        }
      }
    } catch { }

    const result = await prisma.receipt.findUnique({ where: { ReceiptId: receipt.ReceiptId }, include: includeReceipt });
    return res.status(201).json(flattenReceipt(result));
  } catch (e: any) {
    return handleError(res, e);
  }
}

export async function listReceipts(_req: Request, res: Response) {
  try {
    const CompanyId = getCompanyId(_req as any, true)!;
    const WarehouseId = getWarehouseId(_req as any, false); // Optional filter

    // Construct where clause
    const where: any = { CompanyId };
    if (WarehouseId) {
      where.ReceiptDetails = {
        some: { WarehouseId }
      };
    }

    const rows = await prisma.receipt.findMany({
      where,
      orderBy: { ReceiptDateTime: 'desc' },
      include: { PurchaseOrder: { select: poSelect } },
    });
    return res.json(rows.map(flattenReceipt));
  } catch (e) {
    return handleError(res, e);
  }
}

export async function getReceipt(req: Request, res: Response) {
  try {
    const CompanyId = getCompanyId(req, true)!;
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw httpError(400, 'Invalid id');
    const r = await prisma.receipt.findFirst({ where: { ReceiptId: id, CompanyId }, include: includeReceipt });
    if (!r) throw httpError(404, 'Not found');
    return res.json(flattenReceipt(r));
  } catch (e) {
    return handleError(res, e);
  }
}

// Replace header and all details (optional)
export async function updateReceipt(req: Request, res: Response) {
  try {
    const CompanyId = getCompanyId(req, true)!;
    const WarehouseId = getWarehouseId(req, true)!;
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw httpError(400, 'Invalid id');

    const { ReceiptDateTime, details, UpdatedBy } = req.body;
    const header: any = {};
    if (ReceiptDateTime !== undefined) header.ReceiptDateTime = new Date(ReceiptDateTime);
    if (UpdatedBy !== undefined) header.UpdatedBy = UpdatedBy;

    await prisma.$transaction(async (tx) => {
      if (details !== undefined) {
        const normalized = parseDetails(details);
        const receipt = await tx.receipt.findFirst({ where: { ReceiptId: id, CompanyId } });
        if (!receipt) throw httpError(404, 'Not found');
        const { map, total } = await enforceNotExceed(CompanyId, receipt.PurchaseOrderId, normalized, id);
        // Replace details
        await tx.receiptDetail.deleteMany({ where: { ReceiptId: id } });
        await tx.receiptDetail.createMany({
          data: normalized.map(d => ({
            CompanyId,
            WarehouseId,
            ReceiptId: id,
            PurchaseOrderDetailId: map.get(d.MaterialId)!.podId,
            MaterialId: d.MaterialId,
            MaterialQuantity: d.MaterialQuantity,
            UpdatedBy,
          })),
        });
        // Replace stocks derived from this receipt
        await tx.stock.deleteMany({ where: { ReceiptId: id } });
        await tx.stock.createMany({
          data: normalized.map((d, i) => ({
            CompanyId,
            WarehouseId,
            MaterialId: d.MaterialId,
            Quantity: d.MaterialQuantity,
            Barcode: genBarcode(`R${id}`, d.MaterialId, i + 1),
            StockPrice: map.get(d.MaterialId)!.price,
            ReceiptId: id,
            PurchaseOrderId: receipt.PurchaseOrderId,
            Issue: 0,
            Remain: d.MaterialQuantity,
            UpdatedBy,
          })),
        });
        header.ReceiptTotalPrice = total;
      }
      await tx.receipt.update({ where: { ReceiptId: id }, data: header });
    });

    // After update, re-evaluate PO completion
    try {
      const receipt = await prisma.receipt.findFirst({ where: { ReceiptId: id, CompanyId } });
      if (receipt) {
        const allPods = await prisma.purchaseOrderDetail.findMany({
          where: { CompanyId, PurchaseOrderId: receipt.PurchaseOrderId },
          select: { MaterialId: true, PurchaseOrderQuantity: true },
        });
        const matIds = allPods.map((p) => p.MaterialId);
        if (matIds.length) {
          const receivedMap = await getReceivedSumMap(CompanyId, receipt.PurchaseOrderId, matIds);
          const allDone = allPods.every((p) => (receivedMap.get(p.MaterialId) ?? 0) >= p.PurchaseOrderQuantity);
          await prisma.purchaseOrder.update({
            where: { PurchaseOrderId: receipt.PurchaseOrderId },
            data: { PurchaseOrderStatus: allDone ? 'RECEIVED' : 'CONFIRMED' },
          });
        }
      }
    } catch { }

    const result = await prisma.receipt.findUnique({ where: { ReceiptId: id }, include: includeReceipt });
    if (!result) throw httpError(404, 'Not found');
    return res.json(flattenReceipt(result));
  } catch (e: any) {
    return handleError(res, e);
  }
}

export async function deleteReceipt(req: Request, res: Response) {
  try {
    const CompanyId = getCompanyId(req, true)!;
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw httpError(400, 'Invalid id');
    const existed = await prisma.receipt.findFirst({ where: { ReceiptId: id, CompanyId } });
    if (!existed) throw httpError(404, 'Not found');
    await prisma.$transaction(async (tx) => {
      await tx.stock.deleteMany({ where: { ReceiptId: id } });
      await tx.receiptDetail.deleteMany({ where: { ReceiptId: id } });
      await tx.receipt.delete({ where: { ReceiptId: id } });
    });
    return res.status(204).send();
  } catch (e: any) {
    return handleError(res, e);
  }
}
