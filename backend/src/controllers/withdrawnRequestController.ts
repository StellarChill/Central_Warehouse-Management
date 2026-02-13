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
// Helper to generate running number: WR-YYYYMMDD-XXXX (Robust Check)
async function generateWithdrawnRequestCode(companyId: number, date: Date, tx: any = prisma) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const prefix = `WR-${yyyy}${mm}${dd}`;

  // Check valid running numbers inside DB
  const existing = await tx.withdrawnRequest.findMany({
    where: { WithdrawnRequestCode: { startsWith: prefix } },
    select: { WithdrawnRequestCode: true }
  });

  let maxNum = 0;
  for (const r of existing) {
    const parts = r.WithdrawnRequestCode.split('-');
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num) && num > maxNum) maxNum = num;
  }

  let nextNum = maxNum + 1;
  while (true) {
    const candidate = `${prefix}-${String(nextNum).padStart(4, '0')}`;
    const exists = await tx.withdrawnRequest.findFirst({ where: { WithdrawnRequestCode: candidate } });
    if (!exists) return candidate;
    nextNum++;
    if (nextNum > 9999) throw new Error('Request running number exhausted for today');
  }
}

// Create Withdrawn Request
export async function createWithdrawnRequest(req: Request, res: Response) {
  try {
    const CompanyId = getCompanyId(req, true)!;
    let { WithdrawnRequestCode, BranchId, RequestDate, WithdrawnRequestStatus, details, CreatedBy } = req.body;

    // Auto-generate code if missing
    const date = RequestDate ? new Date(RequestDate) : new Date();
    if (!BranchId) throw httpError(400, 'BranchId is required');
    const parsed = parseDetails(details);

    // Optional: Validate materials exist
    const mats = await prisma.material.findMany({ where: { MaterialId: { in: parsed.map(d => d.MaterialId) } }, select: { MaterialId: true } });
    if (mats.length !== parsed.length) throw httpError(400, 'One or more materials are invalid');

    // Retry logic for creation
    let created;
    let attempts = 0;
    while (attempts < 5) {
      try {
        created = await prisma.$transaction(async (tx) => {
          // Auto-generate if missing inside transaction
          let codeToUse = WithdrawnRequestCode;
          if (!codeToUse) {
            codeToUse = await generateWithdrawnRequestCode(CompanyId, date, tx);
          } else {
            // If user supplied code, check once
            const dup = await tx.withdrawnRequest.findFirst({ where: { WithdrawnRequestCode: codeToUse } }); // Global check
            if (dup) throw httpError(409, `WithdrawnRequestCode ${codeToUse} already exists.`);
          }

          const request = await tx.withdrawnRequest.create({
            data: {
              CompanyId,
              WithdrawnRequestCode: codeToUse,
              BranchId: Number(BranchId),
              RequestDate: date,
              WithdrawnRequestStatus: WithdrawnRequestStatus || 'PENDING',
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
        break; // Success
      } catch (e: any) {
        if (e?.code === 'P2002' && !WithdrawnRequestCode) {
          // Retry only if we auto-generated the code
          console.warn('Request Duplicate Code Retry...');
          attempts++;
          continue;
        }
        throw e;
      }
    }

    if (!created) throw new Error('Failed to create request after retries');

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
      include: {
        WithdrawnRequestDetails: {
          include: {
            Material: true
          }
        }
      },
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

    await prisma.$transaction(async (tx) => {
      // 1. Check & Delete related Issue first (to allow cleanup of test data)
      const issue = await tx.issue.findFirst({ where: { RequestId: id, CompanyId } });
      if (issue) {
        // Delete Issue Details
        await tx.issueDetail.deleteMany({ where: { IssueId: issue.IssueId } });
        // Delete Issue
        await tx.issue.delete({ where: { IssueId: issue.IssueId } });
      }

      // 2. Delete Request Details
      await tx.withdrawnRequestDetail.deleteMany({ where: { RequestId: id } });

      // 3. Delete Request
      await tx.withdrawnRequest.delete({ where: { RequestId: id } });
    });

    return res.status(204).send();
  } catch (e) {
    return handleError(res, e);
  }
}
