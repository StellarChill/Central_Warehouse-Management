import { Request, Response } from 'express';
import prisma from '../prisma';

function handleError(res: Response, e: any) {
  console.error(e);
  return res.status(500).json({ error: 'Internal server error' });
}

export async function listStocks(_req: Request, res: Response) {
  try {
    const rows = await prisma.stock.findMany({
      orderBy: { CreatedAt: 'desc' },
      include: { Material: { select: { MaterialId: true, MaterialName: true, Unit: true } } },
    });
    return res.json(rows.map((s: any) => ({
      StockId: s.StockId,
      MaterialId: s.MaterialId,
      MaterialName: s.Material?.MaterialName,
      Unit: s.Material?.Unit,
      Quantity: s.Quantity,
      Remain: s.Remain,
      StockPrice: s.StockPrice,
      Barcode: s.Barcode,
      ReceiptId: s.ReceiptId,
      PurchaseOrderId: s.PurchaseOrderId,
      CreatedAt: s.CreatedAt,
    })));
  } catch (e) {
    return handleError(res, e);
  }
}

export async function getStock(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    const s = await prisma.stock.findUnique({
      where: { StockId: id },
      include: {
        Material: { select: { MaterialId: true, MaterialName: true, Unit: true } },
        Receipt: { select: { ReceiptId: true, ReceiptCode: true } },
        PurchaseOrder: { select: { PurchaseOrderId: true, PurchaseOrderCode: true } },
      },
    });
    if (!s) return res.status(404).json({ error: 'Not found' });
    return res.json({
      StockId: s.StockId,
      MaterialId: s.MaterialId,
      MaterialName: s.Material?.MaterialName,
      Unit: s.Material?.Unit,
      Quantity: s.Quantity,
      Remain: s.Remain,
      StockPrice: s.StockPrice,
      Barcode: s.Barcode,
      ReceiptId: s.ReceiptId,
      ReceiptCode: (s as any).Receipt?.ReceiptCode,
      PurchaseOrderId: s.PurchaseOrderId,
      PurchaseOrderCode: (s as any).PurchaseOrder?.PurchaseOrderCode,
      CreatedAt: s.CreatedAt,
      UpdatedAt: s.UpdatedAt,
    });
  } catch (e) {
    return handleError(res, e);
  }
}

export async function stockSummary(_req: Request, res: Response) {
  try {
    // Aggregate by material
    const mats = await prisma.material.findMany({ select: { MaterialId: true, MaterialName: true, Unit: true } });
    const agg = await prisma.stock.groupBy({
      by: ['MaterialId'],
      _sum: { Quantity: true, Remain: true },
    });
    const index = new Map(agg.map(a => [a.MaterialId, a]));
    const result = mats.map(m => {
      const a = index.get(m.MaterialId);
      return {
        MaterialId: m.MaterialId,
        MaterialName: m.MaterialName,
        Unit: m.Unit,
        TotalQuantity: Number(a?._sum?.Quantity ?? 0),
        TotalRemain: Number(a?._sum?.Remain ?? 0),
      };
    });
    return res.json(result);
  } catch (e) {
    return handleError(res, e);
  }
}
