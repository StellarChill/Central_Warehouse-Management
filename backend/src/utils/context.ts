import { Request } from 'express';

export function getCompanyId(req: Request, required = true): number | undefined {
  const fromHeader = req.headers['x-company-id'];
  const raw = (Array.isArray(fromHeader) ? fromHeader[0] : fromHeader) ?? (req.query.companyId as any) ?? (req.body?.CompanyId ?? req.body?.companyId);
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0) {
    if (required) {
      throw Object.assign(new Error('CompanyId is required'), { status: 400 });
    }
    return undefined;
  }
  return num;
}

export function getWarehouseId(req: Request, required = false): number | undefined {
  const fromHeader = req.headers['x-warehouse-id'];
  const raw = (Array.isArray(fromHeader) ? fromHeader[0] : fromHeader) ?? (req.query.warehouseId as any) ?? (req.body?.WarehouseId ?? req.body?.warehouseId);
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0) {
    if (required) {
      throw Object.assign(new Error('WarehouseId is required'), { status: 400 });
    }
    return undefined;
  }
  return num;
}

export function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}
