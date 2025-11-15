import { Request, Response } from 'express';
import prisma from '../prisma';
import { getCompanyId, getWarehouseId } from '../utils/context';

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

// Allocate from stocks FIFO by CreatedAt (or StockId)
async function allocateFromStock(companyId: number, warehouseId: number, materialId: number, needQty: number) {
  if (needQty <= 0) return [] as { StockId: number; Barcode: string; take: number }[];
  const stocks = await prisma.stock.findMany({
    where: { CompanyId: companyId, WarehouseId: warehouseId, MaterialId: materialId, Remain: { gt: 0 } },
    orderBy: [{ CreatedAt: 'asc' }, { StockId: 'asc' }],
    select: { StockId: true, Barcode: true, Remain: true },
  });
  let remain = needQty;
  const picks: { StockId: number; Barcode: string; take: number }[] = [];
  for (const s of stocks) {
    if (remain <= 0) break;
    const take = Math.min(Number(s.Remain ?? 0), remain);
    if (take > 0) {
      picks.push({ StockId: s.StockId, Barcode: s.Barcode, take });
      remain -= take;
    }
  }
  if (remain > 0) throw httpError(400, `Not enough stock for MaterialId ${materialId}. Need ${needQty}`);
  return picks;
}

export async function createIssueFromRequest(req: Request, res: Response) {
  try {
    const CompanyId = getCompanyId(req, true)!;
    const WarehouseId = getWarehouseId(req, true)!;
    const requestId = Number(req.params.requestId || req.body.RequestId);
    if (!Number.isFinite(requestId)) throw httpError(400, 'RequestId is required');

    const reqRow = await prisma.withdrawnRequest.findFirst({
      where: { RequestId: requestId, CompanyId },
      include: { WithdrawnRequestDetails: true },
    });
    if (!reqRow) throw httpError(404, 'WithdrawnRequest not found');

    // Only one issue per request
    const existedIssue = await prisma.issue.findFirst({ where: { RequestId: requestId, CompanyId } });
    if (existedIssue) throw httpError(400, 'Issue already exists for this request');

    const details = reqRow.WithdrawnRequestDetails;
    if (!details || details.length === 0) throw httpError(400, 'Request has no details');

    // Validate availability and build allocation plan
    const allocations: { MaterialId: number; plan: { StockId: number; Barcode: string; take: number }[] }[] = [];
    for (const d of details) {
      const plan = await allocateFromStock(CompanyId, WarehouseId, d.MaterialId, d.WithdrawnQuantity);
      allocations.push({ MaterialId: d.MaterialId, plan });
    }

    const created = await prisma.$transaction(async (tx) => {
      const issue = await tx.issue.create({
        data: {
          CompanyId,
          RequestId: reqRow.RequestId,
          BranchId: reqRow.BranchId,
          IssueStatus: 'COMPLETED',
          IssueDate: new Date(),
          CreatedBy: reqRow.CreatedBy ?? undefined,
        },
      });

      // Create IssueDetails and update stock.Remain / stock.Issue
      for (const alloc of allocations) {
        for (const p of alloc.plan) {
          await tx.issueDetail.create({
            data: {
              CompanyId,
              RequestId: reqRow.RequestId,
              MaterialId: alloc.MaterialId,
              Barcode: p.Barcode,
              IssueQuantity: p.take,
              IssueId: issue.IssueId,
              CreatedBy: reqRow.CreatedBy ?? undefined,
            },
          });
          await tx.stock.update({
            where: { StockId: p.StockId },
            data: {
              Remain: { decrement: p.take },
              Issue: { increment: p.take },
            },
          });
        }
      }

      return issue;
    });

    const result = await prisma.issue.findUnique({
      where: { IssueId: created.IssueId },
      include: {
        WithdrawnRequest: true,
        IssueDetails: true,
      },
    });
    return res.status(201).json(result);
  } catch (e) {
    return handleError(res, e);
  }
}

export async function listIssues(_req: Request, res: Response) {
  try {
    const CompanyId = getCompanyId(_req as any, true)!;
    const rows = await prisma.issue.findMany({ where: { CompanyId }, orderBy: { IssueDate: 'desc' } });
    return res.json(rows);
  } catch (e) {
    return handleError(res, e);
  }
}

export async function getIssue(req: Request, res: Response) {
  try {
    const CompanyId = getCompanyId(req, true)!;
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw httpError(400, 'Invalid id');
    const row = await prisma.issue.findFirst({
      where: { IssueId: id, CompanyId },
      include: { WithdrawnRequest: true, IssueDetails: true },
    });
    if (!row) throw httpError(404, 'Not found');
    return res.json(row);
  } catch (e) {
    return handleError(res, e);
  }
}

export async function deleteIssue(req: Request, res: Response) {
  try {
    const CompanyId = getCompanyId(req, true)!;
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw httpError(400, 'Invalid id');

    await prisma.$transaction(async (tx) => {
      // Revert stock from issue details
      const details = await tx.issueDetail.findMany({ where: { IssueId: id, CompanyId } });
      for (const d of details) {
        // Find stock row by barcode
        const stock = await tx.stock.findFirst({ where: { Barcode: d.Barcode, CompanyId } });
        if (stock) {
          await tx.stock.update({
            where: { StockId: stock.StockId },
            data: {
              Remain: { increment: d.IssueQuantity },
              Issue: { decrement: d.IssueQuantity },
            },
          });
        }
      }
      await tx.issueDetail.deleteMany({ where: { IssueId: id, CompanyId } });
      await tx.issue.delete({ where: { IssueId: id, CompanyId } as any });
    });

    return res.status(204).send();
  } catch (e) {
    return handleError(res, e);
  }
}
