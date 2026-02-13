import { Request, Response } from 'express';
import prisma from '../prisma';
import { getCompanyId } from '../utils/context';

function httpError(status: number, message: string) {
    const e = new Error(message) as any;
    e.status = status;
    return e;
}

function handleError(res: Response, e: any) {
    console.error(e);
    if (e?.status) return res.status(e.status).json({ error: e.message });
    return res.status(500).json({ error: 'Internal server error' });
}

// Allocate from stocks FIFO (similar to issueController but for adjustment)
async function allocateFromStock(companyId: number, warehouseId: number, materialId: number, needQty: number) {
    if (needQty <= 0) return [] as { StockId: number; take: number }[];
    const stocks = await prisma.stock.findMany({
        where: { CompanyId: companyId, WarehouseId: warehouseId, MaterialId: materialId, Remain: { gt: 0 } },
        orderBy: [{ CreatedAt: 'asc' }, { StockId: 'asc' }],
        select: { StockId: true, Remain: true },
    });
    let remain = needQty;
    const picks: { StockId: number; take: number }[] = [];
    for (const s of stocks) {
        if (remain <= 0) break;
        const take = Math.min(Number(s.Remain ?? 0), remain);
        if (take > 0) {
            picks.push({ StockId: s.StockId, take });
            remain -= take;
        }
    }
    if (remain > 0) {
        throw httpError(400, `สินค้าไม่เพียงพอในคลัง (MaterialId: ${materialId}). ต้องการลด ${needQty} แต่ขาดอีก ${remain}`);
    }
    return picks;
}

export async function createStockAdjustment(req: Request, res: Response) {
    try {
        const CompanyId = getCompanyId(req, true)!;
        const CreatedBy = (req as any).user?.UserId;
        const { WarehouseId, MaterialId, Quantity, Reason } = req.body;

        if (!WarehouseId || !MaterialId || !Quantity) {
            throw httpError(400, "WarehouseId, MaterialId and Quantity are required");
        }

        const qty = Number(Quantity);
        if (qty === 0) throw httpError(400, "Quantity cannot be zero");

        await prisma.$transaction(async (tx) => {
            // 1. Create Adjustment Record
            await tx.stockAdjustment.create({
                data: {
                    CompanyId,
                    WarehouseId,
                    MaterialId,
                    Quantity: qty,
                    Reason,
                    CreatedBy
                }
            });

            // 2. Update Stock
            if (qty > 0) {
                // INCREASE Stock
                // Strategy: Add to a generic stock pile or create new? 
                // Best practice: Create new stock entry with no Receipt/PO, or find existing 'adjustment' stock.
                // For simplicity and traceability: Create a new stock line representing this adjustment
                // But to avoid too many rows, maybe check if there is a recent stock for this material in this warehouse?
                // Let's create a NEW Stock entry to be safe and distinct.
                // We need 'Barcode'... Generate one? or Optional? Stock model says Barcode @unique

                // Generate pseudo-barcode for adjustment
                const timestamp = Date.now();
                const barcode = `ADJ-${MaterialId}-${timestamp}`;

                // Get Price from Material Master?
                const mat = await tx.material.findUnique({ where: { MaterialId } });
                const price = mat?.Price || 0;

                await tx.stock.create({
                    data: {
                        CompanyId,
                        WarehouseId,
                        MaterialId,
                        Quantity: qty,
                        Remain: qty,
                        StockPrice: price,
                        Barcode: barcode,
                        CreatedBy,
                        Issue: 0
                    }
                });
            } else {
                // DECREASE Stock (FIFO)
                const absQty = Math.abs(qty);
                // Reuse logic from allocate
                const picks = await allocateFromStock(CompanyId, WarehouseId, MaterialId, absQty);

                // Update stocks
                for (const p of picks) {
                    await tx.stock.update({
                        where: { StockId: p.StockId },
                        data: {
                            Remain: { decrement: p.take },
                            Issue: { increment: p.take } // Count as issue/used? Or add 'Adjustment' field? Stock has only Issue/Remain.
                            // Ideally Stock model should have 'AdjustedOut' but 'Issue' is fine for "Used" context.
                        }
                    });
                }
            }
        });

        return res.status(201).json({ success: true });
    } catch (e) {
        return handleError(res, e);
    }
}

export async function listStockAdjustments(req: Request, res: Response) {
    try {
        const CompanyId = getCompanyId(req, true)!;
        const where: any = { CompanyId };

        if (req.query.warehouseId) where.WarehouseId = Number(req.query.warehouseId);
        if (req.query.materialId) where.MaterialId = Number(req.query.materialId);

        const rows = await prisma.stockAdjustment.findMany({
            where,
            include: {
                Material: true,
                Warehouse: true,
                CreatedByUser: { select: { UserName: true } }
            },
            orderBy: { CreatedAt: 'desc' },
            take: 100
        });
        return res.json(rows);
    } catch (e) {
        return handleError(res, e);
    }
}
