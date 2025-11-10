import { Request, Response } from 'express';
import prisma from '../prisma';

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

async function getPoDetailMap(poId: number, materialIds: number[]) {
  const pods = await prisma.purchaseOrderDetail.findMany({
    where: { PurchaseOrderId: poId, MaterialId: { in: materialIds } },
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

async function getReceivedSumMap(poId: number, materialIds: number[], excludeReceiptId?: number) {
  // Sum of received quantities per material for the given PO, optionally excluding one receipt (for update case)
  const where: any = {
    MaterialId: { in: materialIds },
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
async function enforceNotExceed(poId: number, details: NormalizedDetail[], excludeReceiptId?: number) {
  const matIds = details.map(d => d.MaterialId);
  const map = await getPoDetailMap(poId, matIds);
  const receivedMap = await getReceivedSumMap(poId, matIds, excludeReceiptId);
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
  const stamp = `${ts.getFullYear()}${pad(ts.getMonth()+1)}${pad(ts.getDate())}${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}${ts.getMilliseconds()}`;
  return `${receiptCode}-${materialId}-${idx}-${stamp}`;
}

// Generate daily running code: RC-YYYYMMDD-0001
async function generateReceiptCode() {
  const pad4 = (n: number) => n.toString().padStart(4, '0');
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const dateStr = `${y}${m}${day}`;
  const prefix = `RC-${dateStr}-`;
  const last = await prisma.receipt.findFirst({
    where: { ReceiptCode: { startsWith: prefix } },
    orderBy: { ReceiptCode: 'desc' },
    select: { ReceiptCode: true },
  });
  const next = last ? Number(last.ReceiptCode.split('-').pop() || '0') + 1 : 1;
  return `${prefix}${pad4(next)}`;
}

// Create Receipt from a PO
export async function createReceipt(req: Request, res: Response) {
  try {
    const { PurchaseOrderId, ReceiptDateTime, details, CreatedBy } = req.body;
    if (!PurchaseOrderId) throw httpError(400, 'PurchaseOrderId is required');

    const normalized = parseDetails(details);
    const poId = Number(PurchaseOrderId);

    const po = await prisma.purchaseOrder.findUnique({ where: { PurchaseOrderId: poId } });
    if (!po) throw httpError(400, 'PurchaseOrder not found');

    const { map, total } = await enforceNotExceed(poId, normalized);
    const rdt = ReceiptDateTime ? new Date(ReceiptDateTime) : new Date();

    // Generate running code (retry once on collision)
    let code = await generateReceiptCode();
    const created = await prisma.$transaction(async (tx) => {
      const receipt = await tx.receipt.create({
        data: { PurchaseOrderId: poId, ReceiptCode: code, ReceiptDateTime: rdt, ReceiptTotalPrice: total, CreatedBy },
      });
      await tx.receiptDetail.createMany({
        data: normalized.map(d => ({
          ReceiptId: receipt.ReceiptId,
          PurchaseOrderDetailId: map.get(d.MaterialId)!.podId,
          MaterialId: d.MaterialId,
          MaterialQuantity: d.MaterialQuantity,
          CreatedBy,
        })),
      });

      // Create stock rows per material (batch-level)
      await tx.stock.createMany({
        data: normalized.map((d, i) => ({
          MaterialId: d.MaterialId,
          Quantity: d.MaterialQuantity,
          Barcode: genBarcode(code, d.MaterialId, i + 1),
          StockPrice: map.get(d.MaterialId)!.price,
          ReceiptId: receipt.ReceiptId,
          PurchaseOrderId: poId,
          Issue: 0,
          Remain: d.MaterialQuantity,
          CreatedBy: CreatedBy,
        })),
      });
      return receipt;
    });

    // After creation, if the PO is fully received, mark it as RECEIVED
    try {
      const allPods = await prisma.purchaseOrderDetail.findMany({
        where: { PurchaseOrderId: created.PurchaseOrderId },
        select: { MaterialId: true, PurchaseOrderQuantity: true },
      });
      const matIds = allPods.map((p) => p.MaterialId);
      if (matIds.length) {
        const receivedMap = await getReceivedSumMap(created.PurchaseOrderId, matIds);
        const allDone = allPods.every((p) => (receivedMap.get(p.MaterialId) ?? 0) >= p.PurchaseOrderQuantity);
        if (allDone) {
          await prisma.purchaseOrder.update({
            where: { PurchaseOrderId: created.PurchaseOrderId },
            data: { PurchaseOrderStatus: 'RECEIVED' },
          });
        }
      }
    } catch {}

    const result = await prisma.receipt.findUnique({ where: { ReceiptId: created.ReceiptId }, include: includeReceipt });
    if (!result) throw httpError(500, 'Failed to load created receipt');
    return res.status(201).json(flattenReceipt(result));
  } catch (e: any) {
    return handleError(res, e);
  }
}

export async function listReceipts(_req: Request, res: Response) {
  try {
    const rows = await prisma.receipt.findMany({
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
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw httpError(400, 'Invalid id');
    const r = await prisma.receipt.findUnique({ where: { ReceiptId: id }, include: includeReceipt });
    if (!r) throw httpError(404, 'Not found');
    return res.json(flattenReceipt(r));
  } catch (e) {
    return handleError(res, e);
  }
}

// Replace header and all details (optional)
export async function updateReceipt(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw httpError(400, 'Invalid id');

    const { ReceiptDateTime, details, UpdatedBy } = req.body;
    const header: any = {};
    if (ReceiptDateTime !== undefined) header.ReceiptDateTime = new Date(ReceiptDateTime);
    if (UpdatedBy !== undefined) header.UpdatedBy = UpdatedBy;

    await prisma.$transaction(async (tx) => {
      if (details !== undefined) {
        const normalized = parseDetails(details);
        const receipt = await tx.receipt.findUnique({ where: { ReceiptId: id } });
        if (!receipt) throw httpError(404, 'Not found');
        const { map, total } = await enforceNotExceed(receipt.PurchaseOrderId, normalized, id);
        // Replace details
        await tx.receiptDetail.deleteMany({ where: { ReceiptId: id } });
        await tx.receiptDetail.createMany({
          data: normalized.map(d => ({
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
      const receipt = await prisma.receipt.findUnique({ where: { ReceiptId: id } });
      if (receipt) {
        const allPods = await prisma.purchaseOrderDetail.findMany({
          where: { PurchaseOrderId: receipt.PurchaseOrderId },
          select: { MaterialId: true, PurchaseOrderQuantity: true },
        });
        const matIds = allPods.map((p) => p.MaterialId);
        if (matIds.length) {
          const receivedMap = await getReceivedSumMap(receipt.PurchaseOrderId, matIds);
          const allDone = allPods.every((p) => (receivedMap.get(p.MaterialId) ?? 0) >= p.PurchaseOrderQuantity);
          await prisma.purchaseOrder.update({
            where: { PurchaseOrderId: receipt.PurchaseOrderId },
            data: { PurchaseOrderStatus: allDone ? 'RECEIVED' : 'CONFIRMED' },
          });
        }
      }
    } catch {}

    const result = await prisma.receipt.findUnique({ where: { ReceiptId: id }, include: includeReceipt });
    if (!result) throw httpError(404, 'Not found');
    return res.json(flattenReceipt(result));
  } catch (e: any) {
    return handleError(res, e);
  }
}

export async function deleteReceipt(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw httpError(400, 'Invalid id');
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
