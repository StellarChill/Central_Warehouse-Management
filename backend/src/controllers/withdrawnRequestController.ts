import { Request, Response } from 'express';
import prisma from '../prisma';
import { getCompanyId } from '../utils/context';

// Helpers
type ReqDetail = { MaterialId: number; WithdrawnQuantity: number };

function httpError(status: number, message: string) {
  const e = new Error(message) as any;
  e.status = status;
  return e;
}

function parseDetails(details: any): ReqDetail[] {
  if (!Array.isArray(details) || details.length === 0) throw httpError(400, 'details must be a non-empty array');
  const seen = new Set<number>();
  const out: ReqDetail[] = [];
  for (const d of details) {
    const MaterialId = Number(d?.MaterialId);
    const WithdrawnQuantity = Number(d?.WithdrawnQuantity);
    if (!Number.isFinite(MaterialId) || MaterialId <= 0) throw httpError(400, 'MaterialId must be a positive number');
    if (!Number.isFinite(WithdrawnQuantity) || WithdrawnQuantity <= 0) throw httpError(400, 'WithdrawnQuantity must be a positive number');
    if (seen.has(MaterialId)) throw httpError(400, 'Duplicate MaterialId in details is not allowed');
    seen.add(MaterialId);
    out.push({ MaterialId, WithdrawnQuantity });
  }
  return out;
}

function handleError(res: Response, e: any) {
  console.error(e);
  if (e?.status) return res.status(e.status).json({ error: e.message });
  if (e?.code === 'P2002') return res.status(409).json({ error: 'Duplicate request code' });
  return res.status(500).json({ error: 'Internal server error' });
}

// Helper to generate running number: WR-YYYYMMDD-XXXX
async function generateWithdrawnRequestCode(companyId: number, date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const prefix = `WR-${yyyy}${mm}${dd}`;

  // Find last code of this day
  const lastRecord = await prisma.withdrawnRequest.findFirst({
    where: {
      CompanyId: companyId,
      WithdrawnRequestCode: { startsWith: prefix }
    },
    orderBy: { WithdrawnRequestCode: 'desc' }
  });

  let nextSeq = 1;
  if (lastRecord) {
    const parts = lastRecord.WithdrawnRequestCode.split('-');
    if (parts.length === 3) {
      const seq = parseInt(parts[2]);
      if (!isNaN(seq)) nextSeq = seq + 1;
    }
  }

  return `${prefix}-${String(nextSeq).padStart(4, '0')}`;
}

// Create Withdrawn Request
export async function createWithdrawnRequest(req: Request, res: Response) {
  try {
    const CompanyId = getCompanyId(req, true)!;
    let { WithdrawnRequestCode, BranchId, RequestDate, WithdrawnRequestStatus, details, CreatedBy } = req.body;

    // Auto-generate code if missing
    const date = RequestDate ? new Date(RequestDate) : new Date();
    if (!WithdrawnRequestCode) {
      WithdrawnRequestCode = await generateWithdrawnRequestCode(CompanyId, date);
    }

    if (!BranchId) throw httpError(400, 'BranchId is required');
    const parsed = parseDetails(details);

    // Check duplicate code (retry logic could be added here similar to receipt)
    const dup = await prisma.withdrawnRequest.findFirst({ where: { WithdrawnRequestCode, CompanyId } });
    if (dup) throw httpError(409, `WithdrawnRequestCode ${WithdrawnRequestCode} already exists. Please try again.`);

    // Optional: Validate materials exist
    const mats = await prisma.material.findMany({ where: { MaterialId: { in: parsed.map(d => d.MaterialId) } }, select: { MaterialId: true } });
    if (mats.length !== parsed.length) throw httpError(400, 'One or more materials are invalid');

    const created = await prisma.$transaction(async (tx) => {
      const request = await tx.withdrawnRequest.create({
        data: {
          CompanyId,
          WithdrawnRequestCode,
          BranchId: Number(BranchId),
          RequestDate: date,
          WithdrawnRequestStatus: WithdrawnRequestStatus || 'PENDING', // Default to PENDING (REQUESTED is old status?)
          CreatedBy,
        },
      });

      await tx.withdrawnRequestDetail.createMany({
        data: parsed.map(d => ({
          CompanyId,
          RequestId: request.RequestId,
          MaterialId: d.MaterialId,
          WithdrawnQuantity: d.WithdrawnQuantity,
          CreatedBy,
        })),
      });

      return request;
    });

    const result = await prisma.withdrawnRequest.findUnique({
      where: { RequestId: created.RequestId },
      include: { WithdrawnRequestDetails: true },
    });

    return res.status(201).json(result);
  } catch (e) {
    return handleError(res, e);
  }
}

export async function listWithdrawnRequests(_req: Request, res: Response) {
  try {
    const CompanyId = getCompanyId(_req as any, true)!;
    const rows = await prisma.withdrawnRequest.findMany({
      where: { CompanyId },
      orderBy: { RequestDate: 'desc' },
    });
    return res.json(rows);
  } catch (e) {
    return handleError(res, e);
  }
}

export async function getWithdrawnRequest(req: Request, res: Response) {
  try {
    const CompanyId = getCompanyId(req, true)!;
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw httpError(400, 'Invalid id');
    const row = await prisma.withdrawnRequest.findFirst({
      where: { RequestId: id, CompanyId },
      include: { WithdrawnRequestDetails: true },
    });
    if (!row) throw httpError(404, 'Not found');
    return res.json(row);
  } catch (e) {
    return handleError(res, e);
  }
}

export async function updateWithdrawnRequest(req: Request, res: Response) {
  try {
    const CompanyId = getCompanyId(req, true)!;
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw httpError(400, 'Invalid id');
    const { RequestDate, WithdrawnRequestStatus, details, UpdatedBy } = req.body;

    // Prevent update if already issued
    const existedIssue = await prisma.issue.findFirst({ where: { RequestId: id, CompanyId } });
    if (existedIssue) throw httpError(400, 'Cannot update: Issue already created for this request');

    const header: any = {};
    if (RequestDate !== undefined) header.RequestDate = new Date(RequestDate);
    if (WithdrawnRequestStatus !== undefined) header.WithdrawnRequestStatus = WithdrawnRequestStatus;
    if (UpdatedBy !== undefined) header.UpdatedBy = UpdatedBy;

    await prisma.$transaction(async (tx) => {
      if (details !== undefined) {
        const parsed = parseDetails(details);
        await tx.withdrawnRequestDetail.deleteMany({ where: { RequestId: id } });
        await tx.withdrawnRequestDetail.createMany({
          data: parsed.map(d => ({
            CompanyId,
            RequestId: id,
            MaterialId: d.MaterialId,
            WithdrawnQuantity: d.WithdrawnQuantity,
            UpdatedBy,
          })),
        });
      }
      await tx.withdrawnRequest.update({ where: { RequestId: id }, data: header });
    });

    const result = await prisma.withdrawnRequest.findUnique({ where: { RequestId: id }, include: { WithdrawnRequestDetails: true } });
    if (!result) throw httpError(404, 'Not found');
    return res.json(result);
  } catch (e) {
    return handleError(res, e);
  }
}

export async function deleteWithdrawnRequest(req: Request, res: Response) {
  try {
    const CompanyId = getCompanyId(req, true)!;
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw httpError(400, 'Invalid id');

    // Prevent delete if already issued
    const existedIssue = await prisma.issue.findFirst({ where: { RequestId: id, CompanyId } });
    if (existedIssue) throw httpError(400, 'Cannot delete: Issue already created for this request');

    await prisma.$transaction(async (tx) => {
      await tx.withdrawnRequestDetail.deleteMany({ where: { RequestId: id } });
      await tx.withdrawnRequest.delete({ where: { RequestId: id } });
    });

    return res.status(204).send();
  } catch (e) {
    return handleError(res, e);
  }
}
