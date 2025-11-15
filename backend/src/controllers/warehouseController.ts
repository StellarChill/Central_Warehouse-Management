import { Request, Response } from 'express';
import prisma from '../prisma';
import { getCompanyId, httpError } from '../utils/context';

function validateWarehousePayload(body: any) {
  if (!body.WarehouseName) return 'WarehouseName is required';
  if (!body.WarehouseCode) return 'WarehouseCode is required';
  return null;
}

export async function createWarehouse(req: Request, res: Response) {
  try {
    const err = validateWarehousePayload(req.body);
    if (err) return res.status(400).json({ error: err });

    const CompanyId = getCompanyId(req, true)!;
    const { WarehouseName, WarehouseAddress, WarehouseCode, CreatedBy } = req.body;

    const exists = await prisma.warehouse.findFirst({ where: { CompanyId, WarehouseCode } });
    if (exists) return res.status(409).json({ error: 'WarehouseCode already exists' });

    const row = await prisma.warehouse.create({
      data: { CompanyId, WarehouseName, WarehouseAddress, WarehouseCode, CreatedBy },
    });
    return res.status(201).json(row);
  } catch (e: any) {
    console.error(e);
    if (e.code === 'P2002') return res.status(409).json({ error: 'WarehouseCode already exists' });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listWarehouses(req: Request, res: Response) {
  try {
    const CompanyId = getCompanyId(req, true)!;
    const rows = await prisma.warehouse.findMany({ where: { CompanyId }, orderBy: { WarehouseName: 'asc' } });
    return res.json(rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getWarehouse(req: Request, res: Response) {
  try {
    const CompanyId = getCompanyId(req, true)!;
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    const row = await prisma.warehouse.findFirst({ where: { WarehouseId: id, CompanyId } });
    if (!row) return res.status(404).json({ error: 'Not found' });
    return res.json(row);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateWarehouse(req: Request, res: Response) {
  try {
    const CompanyId = getCompanyId(req, true)!;
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });

    const existed = await prisma.warehouse.findFirst({ where: { WarehouseId: id, CompanyId } });
    if (!existed) throw httpError(404, 'Not found');

    const { WarehouseName, WarehouseAddress, WarehouseCode, UpdatedBy } = req.body;
    const data: any = {};
    if (WarehouseName !== undefined) data.WarehouseName = WarehouseName;
    if (WarehouseAddress !== undefined) data.WarehouseAddress = WarehouseAddress;
    if (WarehouseCode !== undefined) data.WarehouseCode = WarehouseCode;
    if (UpdatedBy !== undefined) data.UpdatedBy = UpdatedBy;

    const row = await prisma.warehouse.update({ where: { WarehouseId: id }, data });
    return res.json(row);
  } catch (e: any) {
    console.error(e);
    if (e.code === 'P2002') return res.status(409).json({ error: 'WarehouseCode already exists' });
    if (e.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteWarehouse(req: Request, res: Response) {
  try {
    const CompanyId = getCompanyId(req, true)!;
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });

    const existed = await prisma.warehouse.findFirst({ where: { WarehouseId: id, CompanyId } });
    if (!existed) return res.status(404).json({ error: 'Not found' });

    await prisma.warehouse.delete({ where: { WarehouseId: id } });
    return res.status(204).send();
  } catch (e: any) {
    console.error(e);
    if (e.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default {};
